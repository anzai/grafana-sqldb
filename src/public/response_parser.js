///<reference path="app/headers/common.d.ts" />
System.register(['lodash'], function(exports_1) {
    var lodash_1;
    var ResponseParser;
    function addUnique(arr, value) {
        arr[value] = value;
    }
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            }],
        execute: function() {
            ResponseParser = (function () {
                function ResponseParser() {
                }
                ResponseParser.prototype.parse = function (query, results) {
                    if (!results || results.results.length === 0) {
                        return [];
                    }
                    var sqlResults = results.results[0];
                    if (!sqlResults.series) {
                        return [];
                    }
                    var res = {};
                    lodash_1.default.each(sqlResults.series, function (serie) {
                        lodash_1.default.each(serie.values, function (value) {
                            if (lodash_1.default.isArray(value)) {
                                addUnique(res, value[0]);
                            }
                            else {
                                addUnique(res, value);
                            }
                        });
                    });
                    return lodash_1.default.map(res, function (value) {
                        return { text: value };
                    });
                };
                return ResponseParser;
            })();
            exports_1("default", ResponseParser);
        }
    }
});
//# sourceMappingURL=response_parser.js.map