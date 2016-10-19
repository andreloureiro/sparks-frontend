"use strict";
var isEmpty = function (stream) {
    return new stream.constructor(new IsEmpty(stream.source));
};
exports.isEmpty = isEmpty;
var IsEmpty = function IsEmpty(source) {
    this.source = source;
};
IsEmpty.prototype.run = function run(sink, scheduler) {
    return this.source.run(new IsEmptySink(sink), scheduler);
};
var IsEmptySink = function IsEmptySink(sink) {
    this.sink = sink;
    this.isEmpty = true;
};
IsEmptySink.prototype.event = function event(t, x) {
    this.isEmpty = false;
    this.sink.event(t, false);
    this.sink.end(t, x);
};
IsEmptySink.prototype.error = function error(t, e) {
    this.sink.error(t, e);
};
IsEmptySink.prototype.end = function end(t, x) {
    if (this.isEmpty) {
        this.sink.event(t, true);
        this.sink.end(t, x);
    }
};