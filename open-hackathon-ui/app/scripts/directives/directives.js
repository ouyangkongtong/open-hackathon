'use strict';
/**
 * @namespace oh.directives
 * @author <ifendoe@gmail.com>
 * @version 0.0.1
 * Created by Boli Guan on 15-3-12.
 */

angular.module('oh.directives', [])
  /* .run(function ($templateCache) {
   $templateCache.put('hackathon.html', '');
   $templateCache.get('hackathon.html');
   })*/
  .directive('hackathonNav', function ($interval, $cookieStore,$templateCache, API) {
    return {
      restrict: 'E',//'AEMC'
      templateUrl: 'views/tpls/hackathon-nav.html', //<div ng-transclude></div>
      replace: true,
      link: function (scope, elemten, attr) {
        function showErrorMsg(code, msg) {
          $('#load').hide();
          var errorbox = $('#error');
          if (code) {
            errorbox.find('.code').text(code);
          }
          if (msg) {
            errorbox.find('.message').text(msg);
          }
          errorbox.show();
        }

        function bindTemp(data) {
          var servers = data.remote_servers || data.guacamole_servers;
          var work_center = $('.center').on('mouseover', 'iframe', function (e) {
            $(this).focus();
          });
          var hnav = $('.hackathon-nav').on('click', 'a.vm-box', function (e) {
            hnav.find('.vm-box').removeClass('active')
            var a = $(this).addClass('active');
            var url = a.data('url');
            var name = a.attr('id')
            var ifrem = work_center.find('#' + name);
            work_center.find('iframe').addClass('invisible');
            if (ifrem.length > 0) {
              ifrem.removeClass('invisible');
            } else {
              ifrem = $('<iframe>').attr({
                src: url + "&token=" + ($cookieStore.get('User') || '').token,
                id: name,
                width: '100%',
                height: '100%',
                frameborder: 'no',
                marginwidth: '0',
                scrolling: 'no'
              }).appendTo(work_center)
            }
          });
        }

        var temp = $templateCache.get('hackathon-vm.html');
        API.user.experiment.post(JSON.stringify({cid: 'ut', hackathon: scope.config.name}), function (data) {
          var stop;
          var list = [];
          var loopstart = function () {
            API.user.experiment.get({id: data.expr_id}, function (data) {
              if (data.status == 2) {
                var dockers = []
                for (var i in data.public_urls) {
                  dockers.push({
                    purl: data.public_urls[i].url,
                    name: data.remote_servers[i].name,
                    surl: data.remote_servers[i].url
                  })
                  list.push(temp.format(dockers[i]));
                }
                $('.hackathon-nav').append(list.join(''))
                bindTemp(data);
                $('.hackathon-nav a.vm-box:eq(0)').trigger('click');
                $interval.cancel(stop);
              } else if (data.status == 1) {
                stop = $interval(loopstart, 60000, true);
              } else {
                showErrorMsg()
                $interval.cancel(stop);
              }
            });
          }
          loopstart();
          scope.$on('$destroy',
            function (event) {
              $interval.cancel(stop);
            }
          );
        });
      }
    }
  })
  .directive('workFull', function () {
    return {
      restrict: 'A',
      transclude: true,
      template: '<ng-transclude></ng-transclude>',
      link: function (scope, element, attr) {
        element.bind('click', function () {
          $('iframe[class!="invisible"]').addClass('work-full');
          $('.smallscreen').show();
        });
      }
    }
  })
  .directive('workSmall', function () {
    return {
      restrict: 'EA',
      template: '<div class="smallscreen"><a class="glyphicon glyphicon-resize-small" href="javascript:;" ></a></div>',
      link: function (scope, element, attr) {
        var small = element.find('.smallscreen').appendTo('body');
        small.hide();
        small.bind('click', function () {
          $('iframe[class!="invisible"]').removeClass('work-full');
          small.hide();
        });
      }
    }
  })
  .directive('countdown', function ($interval) {
    return {
      restrict: 'E',
      link: function (scope, element, attr) {
        scope.second = parseInt(attr.second);
        var countdown = $interval(function () {
          scope.second--;
        }, 1000, 4, true);
        countdown.then(function () {
          window.location.href = attr.link;
        });
        scope.$on('$destroy', function (event) {
            $interval.cancel(countdown);
          }
        );
      }
    }
  })
  .directive('headdropdownMenu', function ($cookieStore, API) {
    return {
      scope: {},
      restrict: 'E',
      templateUrl: 'views/tpls/dropdown-menu.html',
      link: function (scope) {
        scope.items = [{
          name: '管理我的黑客松',
          link: ''
        }, {
          name: '黑客松活动指南',
          link: ''
        },{
          name: '我的黑客松挑战',
          link: ''
        }, {
          name: '使用帮助',
          link: 'https://github.com/msopentechcn/open-hackathon/wiki/OpenXML-SDK-在线编程黑客松平台《使用帮助》'
        }]
        scope.logout = function () {
          API.user.login.del({});
          $cookieStore.remove('User');
          location.replace('/#/');
        }
        scope.user = $cookieStore.get('User');
      }
    }
  })
  .directive('ohOline', function ($rootScope, $interval, API) {
    return {
      scope: {},
      restrict: 'E',
      templateUrl: 'views/tpls/online-total.html',
      link: function (scope, element) {
        API.hackathon.list.get({name: $rootScope.config.name}, function (data) {
          var getStat = function () {
            API.hackathon.stat.get({hid: $.parseJSON(data).id}, function (data) {
              element.find('[oh-online]').text(data.online);
              element.find('[oh-total]').text(data.total);
            });
          }
          getStat();
          var stop = $interval(function () {
            getStat(0)
          }, 10000);
          scope.$on('$destroy', function (event) {
              $interval.cancel(stop);
            }
          );
        });
      }
    }
  })
  .directive('endCountdown', function ($rootScope, $interval, API) {
    return {
      scope: {},
      restrict: 'EA',
      templateUrl: 'views/tpls/end-countdown.html',
      link: function (scope, element, attr) {
        function show_time() {
          var timing = {day: 0, hour: 0, minute: 0, second: 0, distance: 0};
          this.time_server += 1000
          timing.distance = this.time_end - this.time_server;
          if (timing.distance > 0) {
            timing.day = Math.floor(timing.distance / 86400000)
            timing.distance -= timing.day * 86400000;
            timing.hour = Math.floor(timing.distance / 3600000)
            timing.distance -= timing.hour * 3600000;
            timing.minute = Math.floor(timing.distance / 60000)
            timing.distance -= timing.minute * 60000;
            timing.second = Math.floor(timing.distance / 1000)
            if (timing.day == 0) {
              timing.day = null
            }
            if (timing.hour == 0 && timing.day == null) {
              timing.hour = null
            }
            if (timing.minute == 0 && timing.hour == null) {
              timing.minute = null
            }
            if (timing.second == 0 && timing.minute == null) {
              timing.second = null
            }
            return timing;
          } else {
            return null;
          }
        }

        var timerTmpe = '{day}天{hour}小时{minute}分钟{second}秒';
        API.hackathon.list.get({name: $rootScope.config.name}, function (data) {
          data = $.parseJSON(data);
          var countDown = {
            time_server: new Date().getTime(),
            time_end: new Date(data.end_time.replace(/-/g, '/')).getTime()
          }
          var showCountDown = function () {
            var timing = show_time.apply(countDown);
            if (!timing) {
              element.find('#timer').text('本次活动已结束，非常感谢您的参与。')
              $interval.cancel(stop);
            } else {
              element.find('#end_timer').text(timerTmpe.format(timing))
            }
          }
          showCountDown();
          var stop = $interval(showCountDown, 1000);
          scope.$on('$destroy', function (event) {
              $interval.cancel(stop);
            }
          );
        })
      }
    }
  })
  .directive('ohTooltip', function ($timeout) {
    return {
      scope: {},
      restrict: 'EA',
      templateUrl: 'views/tpls/oh-tooltip.html',
      link: function (scope, element, attr) {
        $timeout(function () {
          element.fadeOut(2000);
        }, 1500)
      }
    }
  })
