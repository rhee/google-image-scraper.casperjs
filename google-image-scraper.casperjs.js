#!/bin/sh

// bin/true 2>/dev/null; exec casperjs              --web-security=false
// --ignore-ssl-errors=true --verbose --log-level=info "$0" "$@" bin/true
// 2>/dev/null; exec casperjs --debug=true --web-security=false
// --ignore-ssl-errors=true --verbose --log-level=info "$0" "$@"

var config = {
    agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50' +
            '.0.2661.94 Safari/537.36',
    timeout: 24 * 60 * 60 * 1000,
    windowWidth: 1920,
    windowHeight: 4320, //1080,
};

var casper_options = {
    verbose: true,
    logLevel: "info",
    pageSettings: {
        webSecurityEnabled: false
    }
};

var casper = require('casper').create(casper_options);
var download_file_into = require('./download-file-into');

// ////////////////////////////////////////////////
// ////////////////////////////////////////////////
// ////////////////////////////////////////////////

casper.options.waitTimeout = config.timeout;
casper.userAgent(config.agent);

// ////////////////////////////////////////////////
// ////////////////////////////////////////////////
// ////////////////////////////////////////////////

Array
    .prototype
    .forEach
    .call([
        'page.error', 'complete.error', 'step.error', 'load.failed', 'resource.error'
    ], function (evname, idx, arry) {
        casper
            .on(evname, function () {
                this.echo('### [' + evname + '] ' + JSON.stringify(arguments), 'ERROR');
            });
    });

casper.on('error', function (message, backtrace) {
    this.echo('### [' + message + ']\n' + JSON.stringify(backtrace, null, '  '), 'ERROR');
});

casper.on('remote.message', function (message) {
    this.echo(message, 'INFO');
});

// ////////////////////////////////////////////////
// ////////////////////////////////////////////////
// //////////////////////////////////////////////// url example:
// https://www.google.com/search?q=%EA%B1%B8%EA%B7%B8%EB%A3%B9&biw=1081&bih=735&s
// ource=lnms&tbm=isch&tbs=qdr:y&sa=X&ved=0ahUKEwjDkrXp-8rRAhUKebwKHU4oCzEQ_AUIBi
// gB#q=%EA%B1%B8%EA%B7%B8%EB%A3%B9&tbs=qdr:y,isz:lt,islt:4mp&tbm=isch var
// cli_urls = casper.cli.args.slice(0);
var cli_keywords = casper
    .cli
    .args
    .slice(0);

var cli_urls = [];
cli_keywords.forEach(function (keyword) {
    cli_urls.push('https://www.google.com/search?q=' + encodeURIComponent(keyword) + '&biw=1920&bih=1080&source=lnms&tbm=isch&tbs=qdr:y&sa=X' +
    // '&ved=~~~~~~~~~~~~~~~~~' +
    '#q=~~&tbs=qdr:y,isz:lt,islt:4mp&tbm=isch')
});

casper.echo(cli_urls);

casper
    .start()
    .eachThen(cli_urls, function (response) {
        this
            .thenOpen(response.data, function (response) {
                handle_page(this);
            });
    });

casper.run(function () {}); // easy fix: put empty function

// ////////////////////////////////////////////////
// ////////////////////////////////////////////////
// ////////////////////////////////////////////////

var download_dir = 'data';
var click_delay = 500; //5000;

var queued_selectors = [];
var visited_selectors = {};

var queued_images = [];
var visited_images = {};

function handle_page(casper) {

    //casper.echo('=== handle_page: ' + casper.getCurrentUrl());

    if (queued_images.length > 0) {
        var image_link = queued_images.shift();
        visited_images[image_link] = image_link;
        casper.echo('download: ' + image_link);
        download_file_into(casper, image_link, download_dir, '.jpg', handle_page);
        return;
    }

    if (queued_selectors.length > 0) {
        var selector = queued_selectors.shift();
        casper.echo('click: ' + selector);
        try {
            casper.click(selector);
        } catch (e) {
            casper.echo(e, 'ERROR');
            casper.then(function () {
                handle_page(casper);
            });
            return;
        }
        casper.wait(click_delay, function () {
            var previews_selector = 'img.irc_mi';
            var previews_link = casper.getElementsInfo(previews_selector);
            for (var i = 0; i < previews_link.length; i++) {
                var image_link = previews_link[i].attributes.src;
                if (image_link && !(image_link in visited_images)) {
                    queued_images.push(image_link);
                    casper.then(function () {
                        handle_page(casper)
                    });
                }
            }
        });
        return;
    }

    if (queued_selectors.length == 0) {
        var thumbs_selector = 'div[data-async-rclass="search"] div'; // a.rg_l';
        var thumbs_selector_n = function (i) {
            return 'div[data-async-rclass="search"] div:nth-child(' + (i + 1) + ') a.rg_l'
        };
        var thumbs_link = casper.getElementsInfo(thumbs_selector);
        for (var i = 0; i < thumbs_link.length; i++) {
            var selector = thumbs_selector_n(i);
            if (selector && !(selector in visited_selectors)) {
                visited_selectors[selector] = (i + 1);
                queued_selectors.push(selector);
                casper.then(function () {
                    handle_page(casper)
                });
            }
        }
    }

}
