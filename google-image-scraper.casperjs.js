#!/bin/sh
//bin/true 2>/dev/null; exec casperjs --web-security=false --ignore-ssl-errors=true --verbose --log-level=info "$0" "$@"
//bin/true 2>/dev/null; exec casperjs --debug=true --web-security=false --ignore-ssl-errors=true --verbose --log-level=info "$0" "$@"

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
var download_file_into = require('download-file-into');

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
// ////////////////////////////////////////////////

var cli_keywords = casper
    .cli
    .args
    .slice(0);

var cli_urls = [];
cli_keywords.forEach(function (keyword) {
    var q = encodeURIComponent(keyword);
    //cli_urls.push('https://www.google.com/search?q=' + q + '&tbas=0&tbs=isz:lt,islt:2mp&tbm=isch')
    cli_urls.push('https://www.google.com/search?q=' + q + '&tbas=0&tbs=isz:lt,islt:4mp&tbm=isch')
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

var download_dir = '.'; //'data';
var click_delay = 500; //5000;

var queued_selectors = [];
var visited_selectors = {};

var queued_images = [];
var visited_images = {};

function handle_page(casper) {

    if (queued_images.length > 0) {
        var image_link = queued_images.shift();
        visited_images[image_link] = image_link;
        casper.echo('=== handle_page: download: ' + image_link);
        download_file_into(casper, image_link, download_dir, '.jpg', handle_page);
        return;
    }

    if (queued_selectors.length == 0) {
        casper.echo('=== handle_page: get more thumbs');
        var thumbs_selector = 'div[data-async-rclass="search"] div'; // a.rg_l';
        var thumbs_selector_n = function (i) {
            return 'div[data-async-rclass="search"] div:nth-child(' + (i + 1) + ') a.rg_l'
        };
        var thumbs_link = casper.getElementsInfo(thumbs_selector);
        for (var i = 0; i < thumbs_link.length; i++) {
            var selector = thumbs_selector_n(i);
            if (selector && !(selector in visited_selectors)) {
                casper.echo('=== handle_page: new_selector: ' + selector);
                visited_selectors[selector] = (i + 1);
                queued_selectors.push(selector);
            }
        }
    }

    if (queued_selectors.length > 0) {
        try {
            var selector = queued_selectors.shift();
            casper.click(selector);
            casper.echo('=== handle_page: click: ' + selector);
        } catch (e) {
            casper.echo(e, 'ERROR');
            casper.then(function () {
                handle_page(casper)
            });
            return;
        }
        casper
            .wait(click_delay, function () {
                var previews_selector = 'img.irc_mi';
                var previews_link = casper.getElementsInfo(previews_selector);
                for (var i = 0; i < previews_link.length; i++) {
                    var image_link = previews_link[i].attributes.src;
                    if (image_link && !(image_link in visited_images)) {
                        casper.echo('=== handle_page: new_link: ' + image_link);
                        queued_images.push(image_link);
                    }
                }
                casper
                    .then(function () {
                        handle_page(casper)
                    });
            });
        return;
    }

    var aa = casper.evaluate(function () {
        return {scrollY: window.scrollY, innerHeighth: window.innerHeight, scrollHeight: document.body.scrollHeight}
    });

    if (aa.scrollY + aa.innerHeight < aa.scrollHeight) {
        casper.echo('=== handle_page: scroll: ' + aa.scrollY + aa.innerHeight + '/' + aa.scrollHeight);
        casper
            .scrollTo(0, aa.scrollY + aa.innerHeight)
            .then(function () {
                handle_page(casper)
            })
    }

}
