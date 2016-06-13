///<reference path="app/headers/common.d.ts" />
System.register(['lodash', 'app/core/utils/datemath', './sql_series', './sql_query', './response_parser'], function(exports_1) {
    var lodash_1, dateMath, sql_series_1, sql_query_1, response_parser_1;
    var SqlDatasource;
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (dateMath_1) {
                dateMath = dateMath_1;
            },
            function (sql_series_1_1) {
                sql_series_1 = sql_series_1_1;
            },
            function (sql_query_1_1) {
                sql_query_1 = sql_query_1_1;
            },
            function (response_parser_1_1) {
                response_parser_1 = response_parser_1_1;
            }],
        execute: function() {
            SqlDatasource = (function () {
                /** @ngInject */
                function SqlDatasource(instanceSettings, $q, backendSrv, templateSrv) {
                    this.$q = $q;
                    this.backendSrv = backendSrv;
                    this.templateSrv = templateSrv;
                    this.type = 'sqldb';
                    this.username = instanceSettings.username;
                    this.password = instanceSettings.password;
                    this.name = instanceSettings.name;
                    this.database = instanceSettings.database;
                    this.interval = (instanceSettings.jsonData || {}).timeInterval;
                    this.supportAnnotations = true;
                    this.supportMetrics = true;
                    this.responseParser = new response_parser_1.default();
                    this.url = instanceSettings.url;
                    this.dbms = (instanceSettings.jsonData || {}).dbms;
                }
                SqlDatasource.prototype.query = function (options) {
                    var _this = this;
                    var queryTargets = [];
                    var i, y;
                    var allQueries = lodash_1.default.map(options.targets, function (target) {
                        if (target.hide) {
                            return [];
                        }
                        if (target.timeColDataType === undefined) {
                            return [];
                        }
                        queryTargets.push(target);
                        var arr = target.timeColDataType.split(':');
                        target.timeCol = arr[0].trim();
                        target.timeDataType = arr[1].trim();
                        var queryModel = new sql_query_1.default(target, _this.templateSrv, options.scopedVars);
                        queryModel.dbms = _this.dbms;
                        var query = queryModel.render(true);
                        query = _this._replaceQueryVars(query, options, target);
                        return query;
                    }).join(";");
                    allQueries = this.templateSrv.replace(allQueries, options.scopedVars);
                    return this._seriesQuery(allQueries).then(function (data) {
                        if (!data || !data.results) {
                            return [];
                        }
                        var seriesList = [];
                        for (i = 0; i < data.results.length; i++) {
                            var result = data.results[i];
                            if (!result || !result.series) {
                                continue;
                            }
                            var target = queryTargets[i];
                            var alias = target.alias;
                            if (alias) {
                                alias = _this.templateSrv.replace(target.alias, options.scopedVars);
                            }
                            var sqlSeries = new sql_series_1.default({ series: data.results[i].series, table: target.table, alias: alias });
                            switch (target.resultFormat) {
                                case 'table': {
                                    seriesList.push(sqlSeries.getTable());
                                    break;
                                }
                                default: {
                                    var timeSeries = sqlSeries.getTimeSeries();
                                    for (y = 0; y < timeSeries.length; y++) {
                                        seriesList.push(timeSeries[y]);
                                    }
                                    break;
                                }
                            }
                        }
                        return { data: seriesList };
                    });
                };
                ;
                SqlDatasource.prototype.annotationQuery = function (options) {
                    var timeDataType = options.annotation.timeDataType;
                    if (!options.annotation.query || options.annotation.query === '') {
                        var castTimeCol = '';
                        if (this._abstractDataType(timeDataType) === 'timestamp') {
                            castTimeCol = this._ts2Num('$timeColumn', timeDataType);
                        }
                        else {
                            castTimeCol = '$timeColumn';
                        }
                        castTimeCol += ' * 1000';
                        options.annotation.query =
                            'SELECT ' +
                                castTimeCol + ' AS "time", ' +
                                (options.annotation.tags || 'NULL') + ' AS "tags", ' +
                                (options.annotation.title || 'NULL') + ' AS "title", ' +
                                (options.annotation.text || 'NULL') + ' AS "text" ' +
                                'FROM ' + options.annotation.schema + '.' + options.annotation.table + ' ' +
                                'WHERE $timeFilter';
                    }
                    var query = options.annotation.query;
                    query = this._replaceQueryVars(query, options, options.annotation);
                    query = this.templateSrv.replace(query, null, 'regex');
                    return this._seriesQuery(query).then(function (data) {
                        if (!data || !data.results || !data.results[0]) {
                            throw { message: 'No results in response from SqlDB' };
                        }
                        return new sql_series_1.default({ series: data.results[0].series, annotation: options.annotation }).getAnnotations();
                    });
                };
                ;
                SqlDatasource.prototype.metricFindQuery = function (query) {
                    var interpolated;
                    try {
                        interpolated = this.templateSrv.replace(query, null, 'regex');
                    }
                    catch (err) {
                        return this.$q.reject(err);
                    }
                    return this._seriesQuery(interpolated)
                        .then(lodash_1.default.curry(this.responseParser.parse)(query));
                };
                ;
                SqlDatasource.prototype._seriesQuery = function (query) {
                    return this._sqlRequest('POST', '/query', { query: query, epoch: 'ms' });
                };
                SqlDatasource.prototype.serializeParams = function (params) {
                    if (!params) {
                        return '';
                    }
                    return lodash_1.default.reduce(params, function (memo, value, key) {
                        if (value === null || value === undefined) {
                            return memo;
                        }
                        memo.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
                        return memo;
                    }, []).join("&");
                };
                SqlDatasource.prototype.testDatasource = function () {
                    return this.metricFindQuery('SELECT 1 AS num').then(function () {
                        return { status: "success", message: "Data source is working", title: "Success" };
                    });
                };
                SqlDatasource.prototype._sqlRequest = function (method, url, data) {
                    var self = this;
                    var options = {
                        method: method,
                        url: this.url + url,
                        data: data,
                        precision: "ms",
                        inspect: { type: 'sqldb' },
                        paramSerializer: this.serializeParams,
                    };
                    return this.backendSrv.datasourceRequest(options).then(function (result) {
                        return result.data;
                    }, function (err) {
                        if (err.status !== 0 || err.status >= 300) {
                            if (err.data && err.data.error) {
                                throw { message: 'SqlDB Error Response: ' + err.data.error, data: err.data, config: err.config };
                            }
                            else {
                                throw { message: 'SqlDB Error: ' + err.message, data: err.data, config: err.config };
                            }
                        }
                    });
                };
                ;
                SqlDatasource.prototype._replaceQueryVars = function (query, options, target) {
                    var from = this._getSubTimestamp(options.rangeRaw.from, target.timeDataType, false);
                    var to = this._getSubTimestamp(options.rangeRaw.to, target.timeDataType, true);
                    var isToNow = (options.rangeRaw.to === 'now');
                    var timeFilter = this._getTimeFilter(isToNow);
                    query = query.replace(/\$timeFilter/g, timeFilter);
                    query = query.replace(/\$from/g, from);
                    query = query.replace(/\$to/g, to);
                    from = this._getSubTimestamp(options.rangeRaw.from, 'numeric', false);
                    to = this._getSubTimestamp(options.rangeRaw.to, 'numeric', true);
                    query = query.replace(/\$unixFrom/g, from);
                    query = query.replace(/\$unixTo/g, to);
                    from = this._getSubTimestamp(options.rangeRaw.from, 'timestamp with time zone', false);
                    to = this._getSubTimestamp(options.rangeRaw.to, 'timestamp with time zone', true);
                    query = query.replace(/\$timeFrom/g, from);
                    query = query.replace(/\$timeTo/g, to);
                    var unixtimeColumn = this._getRoundUnixTime(target);
                    query = query.replace(/\$unixtimeColumn/g, unixtimeColumn);
                    query = query.replace(/\$timeColumn/g, target.timeCol);
                    var autoIntervalNum = this._getIntervalNum(target.interval || options.interval);
                    query = query.replace(/\$interval/g, autoIntervalNum);
                    return query;
                };
                SqlDatasource.prototype._getTimeFilter = function (isToNow) {
                    if (isToNow) {
                        return '$timeColumn > $from';
                    }
                    else {
                        return '$timeColumn > $from AND $timeColumn < $to';
                    }
                };
                SqlDatasource.prototype._getSubTimestamp = function (date, toDataType, roundUp) {
                    var rtn = null;
                    if (lodash_1.default.isString(date)) {
                        if (date === 'now') {
                            switch (this._abstractDataType(toDataType)) {
                                case 'timestamp':
                                    return this._num2Ts('now()');
                                case 'numeric':
                                    return this._ts2Num('now()', 'timestamp with time zone');
                            }
                        }
                        var parts = /^now-(\d+)([d|h|m|s])$/.exec(date);
                        if (parts) {
                            var amount = parseInt(parts[1]);
                            var unit = parts[2];
                            switch (this.dbms) {
                                case 'postgres':
                                    rtn = '(now() - \'' + amount + unit + '\'::interval)';
                                    break;
                                case "mysql":
                                    var units = {
                                        'd': 'DAY',
                                        'h': 'HOUR',
                                        'm': 'MINUTE',
                                        's': 'SECOND',
                                        'w': 'WEEK',
                                    };
                                    rtn = 'DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL ' + amount + ' ' + units[unit] + ')';
                                    break;
                                default:
                                    break;
                            }
                        }
                        else {
                            date = dateMath.parse(date, roundUp);
                        }
                    }
                    var isNumericDate = false;
                    if (rtn == null) {
                        rtn = (date.valueOf() / 1000).toFixed(0);
                        isNumericDate = true;
                    }
                    switch (this._abstractDataType(toDataType)) {
                        case 'timestamp':
                            if (isNumericDate) {
                                rtn = this._num2Ts(rtn);
                            }
                            break;
                        case 'numeric':
                            if (!isNumericDate) {
                                rtn = this._ts2Num(rtn, 'timestamp with time zone');
                            }
                            break;
                    }
                    return rtn;
                };
                SqlDatasource.prototype._getRoundUnixTime = function (target) {
                    var col = '$timeColumn';
                    if (this._abstractDataType(target.timeDataType) === 'timestamp') {
                        col = this._ts2Num(col, 'timestamp with time zone');
                    }
                    var rtn = col;
                    if (target.groupBy && target.groupBy.length > 0) {
                        var interval = this._getIntervalNum(target.groupBy[0].params[0]);
                        switch (this.dbms) {
                            case "postgres":
                                rtn = 'round(' + col + ' / ' + interval + ') * ' + interval;
                                break;
                            case "mysql":
                                rtn = '(' + col + ' DIV ' + interval + ') * ' + interval;
                                break;
                        }
                    }
                    return rtn;
                };
                SqlDatasource.prototype._num2Ts = function (str) {
                    if (str === 'now()') {
                        return str;
                    }
                    else {
                        switch (this.dbms) {
                            case 'postgres':
                                return 'to_timestamp(' + str + ')';
                            case 'mysql':
                                return 'FROM_UNIXTIME(' + str + ')';
                            default:
                                return str;
                        }
                    }
                };
                SqlDatasource.prototype._ts2Num = function (str, toDataType) {
                    switch (this.dbms) {
                        case 'postgres':
                            return 'extract(epoch from ' + str + '::' + this._pgShortTs(toDataType) + ')';
                        case 'mysql':
                            return 'UNIX_TIMESTAMP(' + str + ')';
                        default:
                            return str;
                    }
                };
                SqlDatasource.prototype._getIntervalNum = function (str) {
                    var rtn = str;
                    if (str === 'auto') {
                        return '$interval';
                    }
                    var parts = /^(\d+)([a-z]*)$/.exec(str);
                    if (parts) {
                        var amount = parseInt(parts[1]);
                        var unit = parts[2];
                        // cast to seconds
                        switch (unit) {
                            case 'ms':
                                rtn = amount / 1000;
                                break;
                            case 'm':
                                rtn = amount * 60;
                                break;
                            case 'h':
                                rtn = amount * 60 * 12;
                                break;
                            case 'd':
                                rtn = amount * 60 * 12 * 24;
                                break;
                            case 'w':
                                rtn = amount * 60 * 12 * 24 * 7;
                                break;
                            default:
                                rtn = amount;
                        }
                    }
                    return rtn;
                };
                SqlDatasource.prototype._abstractDataType = function (datatype) {
                    switch (datatype) {
                        case 'timestamp with time zone':
                        case 'timestamp without time zone':
                        case 'timestamp':
                        case 'timestamptz':
                        case 'datetime':
                        case 'date':
                            return 'timestamp';
                        case 'numeric':
                        case 'decimal':
                        case 'bigint':
                        case 'integer':
                        case 'real':
                        case 'float':
                        case 'double':
                        case 'double precision':
                            return 'numeric';
                        default:
                            return datatype;
                    }
                };
                SqlDatasource.prototype._pgShortTs = function (str) {
                    switch (str) {
                        case 'timestamptz':
                        case 'timestamp with time zone':
                            return 'timestamptz';
                        case 'timestamp':
                        case 'timestamp without time zone':
                            return 'timestamp';
                        default:
                            return str;
                    }
                    ;
                };
                return SqlDatasource;
            })();
            exports_1("default", SqlDatasource);
        }
    }
});
//# sourceMappingURL=datasource.js.map