/* global NexT: true */

NexT.utils = NexT.$u = {
  /**
   * Wrap images with fancybox support.
   */
  wrapImageWithFancyBox: function () {
    $('.content img')
      .not('[hidden]')
      .not('.group-picture img, .post-gallery img')
      .each(function () {
        var $image = $(this);
        var imageTitle = $image.attr('title');
        var $imageWrapLink = $image.parent('a');

        if ($imageWrapLink.size() < 1) {
	        var imageLink = ($image.attr('data-original')) ? this.getAttribute('data-original') : this.getAttribute('src');
          $imageWrapLink = $image.wrap('<a href="' + imageLink + '"></a>').parent('a');
        }

        if (!$imageWrapLink.attr('data-fancybox')) {
          $imageWrapLink.attr('data-fancybox', 'group');
        }

        if (imageTitle) {
          $imageWrapLink.append('<p class="image-caption">' + imageTitle + '</p>');

          //make sure img title tag will show correctly in fancybox
          $imageWrapLink.attr('title', imageTitle);
        }
      });

      // for Fancybox 5.0.36, it's too lag, so I didn't use it.
      // Fancybox.bind("[data-fancybox]", {
      //   // Transition effect when changing gallery items
      //   // Carousel: {
      //   //   transition: "slide",
      //   // },
      //   // // Disable image zoom animation on opening and closing
      //   // Images: {
      //   //   zoom: true,
      //   // },
      //   // // Custom CSS transition on opening
      //   // showClass: "f-fadeIn",
      //   Thumbs: false,
      //   hideScrollbar: false,
      //   Images: {
      //     initialSize: "fit",
      //   },
      //   height: 600,
      // });

    $('[data-fancybox]').fancybox({
      buttons : [
        // 'slideShow',
        'fullScreen',
        'thumbs',
        // 'share',
        //'download',
        //'zoom',
        'close'
      ],
      // animationEffect : "zoom",
      // animationEffect : "tube",
      animationEffect : "circular",
      // animationEffect : "rotate",
      // animationEffect : "fade",
      // animationEffect : "slide",
      // animationEffect : "zoom-in-out",
      // transitionEffect : "tube",
      transitionEffect : "circular",
      mobile : {
        idleTime : false,
        margin   : 0,

        clickContent : function( current, event ) {
            return current.type === 'image' ? 'toggleControls' : false;
        },
        clickSlide : function( current, event ) {
            return current.type === 'image' ? 'close' : false;
        },
        dblclickContent : function( current, event ) {
            return current.type === 'image' ? 'zoom' : false;
        },
        // dblclickSlide : function( current, event ) {
        //     return current.type === 'image' ? 'zoom' : false;
        // }
      },
    });

  },

  // lazyLoadPostsImages: function () {
  //   // $('#posts').find('img').lazyload({
  //   //   placeholder: '/images/loading.gif',
  //   //   effect: 'fadeIn',
  //   //   threshold : 0
  //   // });
  //     $('#posts img').each(function () {
  //       const $img = $(this);
  //
  //       // // Skip if already has loading attribute
  //       // if (!$img.attr('loading')) {
  //       //   $img.attr('loading', 'lazy');
  //       // }
  //
  //       $img.on('load', function () {
  //         $(this).addClass('lazy-loaded');
  //         console.log('loaded 12ijoaijsodjfa');
  //       });
  //
  //       // If the image was already loaded before .on('load') was attached
  //       if ($img[0].complete) {
  //         $img.addClass('lazy-loaded');
  //         console.log('loaded 122223332ijoaijsodjfa');
  //       }
  //
  //     });
  // },

  /**
   * Tabs tag listener (without twitter bootstrap).
   */
  registerTabsTag: function () {
    var tNav = '.tabs ul.nav-tabs ';

    // Binding `nav-tabs` & `tab-content` by real time permalink changing.
    $(function() {
      $(window).bind('hashchange', function() {
        var tHash = location.hash;
        if (tHash !== '') {
          $(tNav + 'li:has(a[href="' + tHash + '"])').addClass('active').siblings().removeClass('active');
          $(tHash).addClass('active').siblings().removeClass('active');
        }
      }).trigger('hashchange');
    });

    $(tNav + '.tab').on('click', function (href) {
      href.preventDefault();
      // Prevent selected tab to select again.
      if(!$(this).hasClass('active')){

        // Add & Remove active class on `nav-tabs` & `tab-content`.
        $(this).addClass('active').siblings().removeClass('active');
        var tActive = $(this).find('a').attr('href');
        $(tActive).addClass('active').siblings().removeClass('active');

        // Clear location hash in browser if #permalink exists.
        if (location.hash !== '') {
          history.pushState('', document.title, window.location.pathname + window.location.search);
        }
      }
    });

  },

  registerESCKeyEvent: function () {
    $(document).on('keyup', function (event) {
      var shouldDismissSearchPopup = event.which === 27 &&
        $('.search-popup').is(':visible');
      if (shouldDismissSearchPopup) {
        $('.search-popup').hide();
        $('.search-popup-overlay').remove();
        $('body').css('overflow', '');
      }
    });
  },

  registerBackToTop: function () {
    var THRESHOLD = 50;
    var $top = $('.back-to-top');

    $(window).on('scroll', function () {
      $top.toggleClass('back-to-top-on', window.pageYOffset > THRESHOLD);

      var scrollTop = $(window).scrollTop();
      var docHeight = $('#content').height();
      var winHeight = $(window).height();
      var contentMath = (docHeight > winHeight) ? (docHeight - winHeight) : ($(document).height() - winHeight);
      var scrollPercent = (scrollTop) / (contentMath);
      var scrollPercentRounded = Math.round(scrollPercent*100);
      var scrollPercentMaxed = (scrollPercentRounded > 100) ? 100 : scrollPercentRounded;
      $('#scrollpercent>span').html(scrollPercentMaxed);
    });

    $top.on('click', function () {
      $('body').velocity('scroll');
    });
  },

  /**
   * Transform embedded video to support responsive layout.
   * @see http://toddmotto.com/fluid-and-responsive-youtube-and-vimeo-videos-with-fluidvids-js/
   */
  embeddedVideoTransformer: function () {
    var $iframes = $('iframe');

    // Supported Players. Extend this if you need more players.
    var SUPPORTED_PLAYERS = [
      'www.youtube.com',
      'player.vimeo.com',
      'player.youku.com',
      'music.163.com',
      'www.tudou.com'
    ];
    var pattern = new RegExp( SUPPORTED_PLAYERS.join('|') );

    $iframes.each(function () {
      var iframe = this;
      var $iframe = $(this);
      var oldDimension = getDimension($iframe);
      var newDimension;

      if (this.src.search(pattern) > 0) {

        // Calculate the video ratio based on the iframe's w/h dimensions
        var videoRatio = getAspectRadio(oldDimension.width, oldDimension.height);

        // Replace the iframe's dimensions and position the iframe absolute
        // This is the trick to emulate the video ratio
        $iframe.width('100%').height('100%')
          .css({
            position: 'absolute',
            top: '0',
            left: '0'
          });


        // Wrap the iframe in a new <div> which uses a dynamically fetched padding-top property
        // based on the video's w/h dimensions
        var wrap = document.createElement('div');
        wrap.className = 'fluid-vids';
        wrap.style.position = 'relative';
        wrap.style.marginBottom = '20px';
        wrap.style.width = '100%';
        wrap.style.paddingTop = videoRatio + '%';
        // Fix for appear inside tabs tag.
        (wrap.style.paddingTop === '') && (wrap.style.paddingTop = '50%');

        // Add the iframe inside our newly created <div>
        var iframeParent = iframe.parentNode;
        iframeParent.insertBefore(wrap, iframe);
        wrap.appendChild(iframe);

        // Additional adjustments for 163 Music
        if (this.src.search('music.163.com') > 0) {
          newDimension = getDimension($iframe);
          var shouldRecalculateAspect = newDimension.width > oldDimension.width ||
                                        newDimension.height < oldDimension.height;

          // 163 Music Player has a fixed height, so we need to reset the aspect radio
          if (shouldRecalculateAspect) {
            wrap.style.paddingTop = getAspectRadio(newDimension.width, oldDimension.height) + '%';
          }
        }
      }
    });

    function getDimension($element) {
      return {
        width: $element.width(),
        height: $element.height()
      };
    }

    function getAspectRadio(width, height) {
      return height / width * 100;
    }
  },

  /**
   * Add `menu-item-active` class name to menu item
   * via comparing location.path with menu item's href.
   */
  addActiveClassToMenuItem: function () {
    var path = window.location.pathname;
    if (path === '/') {
      return;
    }
    path = path.substring(0, path.length - 1);
    $('.menu-item a[href^="' + path + '"]').parent().addClass('menu-item-active');
  },

  hasMobileUA: function () {
    var nav = window.navigator;
    var ua = nav.userAgent;
    var pa = /iPad|iPhone|Android|Opera Mini|BlackBerry|webOS|UCWEB|Blazer|PSP|IEMobile|Symbian/g;

    return pa.test(ua);
  },

  isTablet: function () {
    return window.screen.width < 992 && window.screen.width > 767 && this.hasMobileUA();
  },

  isMobile: function () {
    return window.screen.width < 767 && this.hasMobileUA();
  },

  isDesktop: function () {
    return !this.isTablet() && !this.isMobile();
  },

  /**
   * Escape meta symbols in jQuery selectors.
   *
   * @param selector
   * @returns {string|void|XML|*}
   */
  escapeSelector: function (selector) {
    return selector.replace(/[!"$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, '\\$&');
  },

  displaySidebar: function () {
    if (!this.isDesktop() || this.isPisces() || this.isGemini()) {
      return;
    }
    $('.sidebar-toggle').trigger('click');
  },

  sidebarScrollToCenter: function() {
    var tocSelector = '.post-toc';
    var $tocElement = $(tocSelector);
    // var activeCurrentSelector = '.active-current';
    var $currentActiveElement = $(tocSelector + ' .active').last();
    // removeCurrentActiveClass();
    // $currentActiveElement.addClass('active-current');
    // Scrolling to center active TOC element if TOC content is taller then viewport.
    if ($currentActiveElement.offset() === undefined) {
      return;
    }
    $tocElement.animate({ scrollTop: $currentActiveElement.offset().top - $tocElement.offset().top + $tocElement.scrollTop() - ($tocElement.height() / 2) }, 300); // 300ms 动画滚动
    // $tocElement.scrollTop($currentActiveElement.offset().top - $tocElement.offset().top + $tocElement.scrollTop() - ($tocElement.height() / 2));
  },

  isMist: function () {
    return CONFIG.scheme === 'Mist';
  },

  isPisces: function () {
    return CONFIG.scheme === 'Pisces';
  },

  isGemini: function () {
    return CONFIG.scheme === 'Gemini';
  },

  getScrollbarWidth: function () {
    var $div = $('<div />').addClass('scrollbar-measure').prependTo('body');
    var div = $div[0];
    var scrollbarWidth = div.offsetWidth - div.clientWidth;

    $div.remove();

    return scrollbarWidth;
  },

  /**
   * Affix behaviour for Sidebar.
   *
   * @returns {Boolean}
   */
  needAffix: function () {
    return this.isPisces() || this.isGemini();
  }
};
