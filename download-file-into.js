var fs = require('fs'),
    childProcess = require("child_process");

var download_wait_delay = 5000;
var last_file_number = 1;

function download_file_into(casper, url, download_dir, ext, cb) {
    var download_filename = make_filename(download_dir, ext);
    download_file_as(casper, url, download_filename, cb);
}

function download_file_as(casper, url, new_filename, cb) {
    if (fs.exists(new_filename)) {
        csv_log(casper, 'download_file', ['skip', 'filename', new_filename, 'url', url, 'err', 'already exists']);
        if (cb) casper.then(function() { cb(casper) });
        return;
    }

    var wget = "wget"; //"/usr/bin/wget";
    var params = ["-q", "-O", new_filename, url];

    childProcess.execFile(
        wget,
        params,
        null,
        function(err, stdout, stderr) {
            if(err){
                casper.echo(stderr,'ERROR');
            }
            csv_log(casper, 'download_file', ['proceed', 'filename', new_filename, 'url', url, 'err', JSON.stringify(err)]);
            //casper.echo(stdout,'INFO');
        });

    casper.wait(download_wait_delay, function() {
        if (cb) cb(casper)
    });
}

function make_filename(output_dir, ext) {
    var ext, filename;
    do {
        last_file_number += 1;
        filename = output_dir + '/' + pad(last_file_number, 8) + ext;
    } while (fs.exists(filename));
    return filename;
}

// format number
function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function csv_log(casper, tag, list) {
    casper.echo('=== ' + tag + ': ' + list.join(','), 'INFO');
    var elems = [JSON.stringify(tag)];
    for (var i = 0; i < list.length; i++) {
        elems.push(JSON.stringify(list[i]));
    }
    fs.write('log.csv', Array.prototype.join.call(elems, ',') + '\n', 'a');
}

module.exports = download_file_into;