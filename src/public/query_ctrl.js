///<reference path="app/headers/common.d.ts" />
System.register(['./query_part_editor', 'angular', 'lodash', './query_builder', './sql_query', './query_part', 'app/plugins/sdk'], function(exports_1) {
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var angular_1, lodash_1, query_builder_1, sql_query_1, query_part_1, sdk_1;
    var SqlQueryCtrl;
    return {
        setters:[
            function (_1) {},
            function (angular_1_1) {
                angular_1 = angular_1_1;
            },
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (query_builder_1_1) {
                query_builder_1 = query_builder_1_1;
            },
            function (sql_query_1_1) {
                sql_query_1 = sql_query_1_1;
            },
            function (query_part_1_1) {
                query_part_1 = query_part_1_1;
            },
            function (sdk_1_1) {
                sdk_1 = sdk_1_1;
            }],
        execute: function() {
            SqlQueryCtrl = (function (_super) {
                __extends(SqlQueryCtrl, _super);
                /** @ngInject **/
                function SqlQueryCtrl($scope, $injector, templateSrv, $q, uiSegmentSrv) {
                    _super.call(this, $scope, $injector);
                    this.templateSrv = templateSrv;
                    this.$q = $q;
                    this.uiSegmentSrv = uiSegmentSrv;
                    this.target = this.target;
                    this.matchOperators = query_part_1.default.getMatchOperators(this.datasource.dbms);
                    this.queryModel = new sql_query_1.default(this.target, templateSrv, this.panel.scopedVars);
                    this.queryBuilder = new query_builder_1.default(this.target, { matchOperators: this.matchOperators });
                    this.resultFormats = [
                        { text: 'Time series', value: 'time_series' },
                        { text: 'Table', value: 'table' },
                    ];
                    this.schemaSegment = uiSegmentSrv.newSegment(this.target.schema);
                    if (!this.target.table) {
                        this.tableSegment = uiSegmentSrv.newSelectMeasurement();
                    }
                    else {
                        this.tableSegment = uiSegmentSrv.newSegment(this.target.table);
                    }
                    this.timeColDataTypeSegment = uiSegmentSrv.newSegment(this.target.timeColDataType);
                    this.tagSegments = [];
                    for (var _i = 0, _a = this.target.tags; _i < _a.length; _i++) {
                        var tag = _a[_i];
                        if (!tag.operator) {
                            if (/^\/.*\/$/.test(tag.value)) {
                                tag.operator = this.matchOperators.match;
                            }
                            else {
                                tag.operator = '=';
                            }
                        }
                        if (tag.condition) {
                            this.tagSegments.push(uiSegmentSrv.newCondition(tag.condition));
                        }
                        this.tagSegments.push(uiSegmentSrv.newKey(tag.key));
                        this.tagSegments.push(uiSegmentSrv.newOperator(tag.operator));
                        this.tagSegments.push(uiSegmentSrv.newKeyValue(tag.value));
                    }
                    this.fixTagSegments();
                    this.buildSelectMenu();
                    this.removeTagFilterSegment = uiSegmentSrv.newSegment({ fake: true, value: '-- remove tag filter --' });
                    /*
                     TODO:
                     This doen't work well when trying to change a parameter from the default value put by setDefault().
                    if (this.target.isNew) {
                      this.setDefault();
                    }
                    */
                }
                SqlQueryCtrl.prototype.setDefault = function () {
                    var _this = this;
                    var query = this.queryBuilder.buildExploreQuery('SET_DEFAULT');
                    this.datasource._seriesQuery(query).then(function (data) {
                        if (!data.results[0].series[0].values) {
                            return;
                        }
                        var result = data.results[0].series[0].values[0];
                        _this.target.schema = result[0];
                        _this.target.table = result[1];
                        _this.target.timeColDataType = result[2];
                        _this.schemaSegment = _this.uiSegmentSrv.newSegment(_this.target.schema);
                        _this.tableSegment = _this.uiSegmentSrv.newSegment(_this.target.table);
                        _this.timeColDataTypeSegment = _this.uiSegmentSrv.newSegment(_this.target.timeColDataType);
                    });
                };
                SqlQueryCtrl.prototype.buildSelectMenu = function () {
                    var categories = query_part_1.default.getCategories();
                    this.selectMenu = lodash_1.default.reduce(categories, function (memo, cat, key) {
                        var menu = {
                            text: key,
                            submenu: cat.map(function (item) {
                                return { text: item.type, value: item.type };
                            }),
                        };
                        memo.push(menu);
                        return memo;
                    }, []);
                };
                SqlQueryCtrl.prototype.groupByAction = function () {
                    this.panelCtrl.refresh();
                };
                SqlQueryCtrl.prototype.removeGroupByPart = function (part, index) {
                    this.queryModel.removeGroupByPart(part, index);
                    this.panelCtrl.refresh();
                };
                SqlQueryCtrl.prototype.addSelectPart = function (selectParts, cat, subitem) {
                    this.queryModel.addSelectPart(selectParts, subitem.value);
                    this.panelCtrl.refresh();
                };
                SqlQueryCtrl.prototype.removeSelectPart = function (selectParts, part) {
                    this.queryModel.removeSelectPart(selectParts, part);
                    this.panelCtrl.refresh();
                };
                SqlQueryCtrl.prototype.selectPartUpdated = function () {
                    this.panelCtrl.refresh();
                };
                SqlQueryCtrl.prototype.fixTagSegments = function () {
                    var count = this.tagSegments.length;
                    var lastSegment = this.tagSegments[Math.max(count - 1, 0)];
                    if (!lastSegment || lastSegment.type !== 'plus-button') {
                        this.tagSegments.push(this.uiSegmentSrv.newPlusButton());
                    }
                };
                SqlQueryCtrl.prototype.tableChanged = function () {
                    this.target.table = this.tableSegment.value;
                    this.panelCtrl.refresh();
                };
                SqlQueryCtrl.prototype.getSchemaSegments = function () {
                    var schemasQuery = this.queryBuilder.buildExploreQuery('SCHEMA');
                    return this.datasource.metricFindQuery(schemasQuery)
                        .then(this.transformToSegments(false))
                        .catch(this.handleQueryError.bind(this));
                };
                SqlQueryCtrl.prototype.schemaChanged = function () {
                    this.target.schema = this.schemaSegment.value;
                    this.panelCtrl.refresh();
                };
                SqlQueryCtrl.prototype.getTimeColDataTypeSegments = function () {
                    var timeColQuery = this.queryBuilder.buildExploreQuery('FIELDS');
                    return this.datasource.metricFindQuery(timeColQuery)
                        .then(this.transformToSegments(false))
                        .catch(this.handleQueryError.bind(this));
                };
                SqlQueryCtrl.prototype.timeColDataTypeChanged = function () {
                    this.target.timeColDataType = this.timeColDataTypeSegment.value;
                    this.panelCtrl.refresh();
                };
                SqlQueryCtrl.prototype.toggleEditorMode = function () {
                    try {
                        this.target.query = this.queryModel.render(false);
                    }
                    catch (err) {
                        console.log('query render error');
                    }
                    this.target.rawQuery = !this.target.rawQuery;
                };
                SqlQueryCtrl.prototype.getTableSegments = function () {
                    var query = this.queryBuilder.buildExploreQuery('TABLES');
                    return this.datasource.metricFindQuery(query)
                        .then(this.transformToSegments(true))
                        .catch(this.handleQueryError.bind(this));
                };
                SqlQueryCtrl.prototype.getPartOptions = function (part) {
                    if (part.def.type === 'field') {
                        var fieldsQuery = this.queryBuilder.buildExploreQuery('TAG_KEYS');
                        return this.datasource.metricFindQuery(fieldsQuery)
                            .then(this.transformToSegments(true))
                            .catch(this.handleQueryError.bind(this));
                    }
                };
                SqlQueryCtrl.prototype.handleQueryError = function (err) {
                    this.error = err.message || 'Failed to issue metric query';
                    return [];
                };
                SqlQueryCtrl.prototype.transformToSegments = function (addTemplateVars) {
                    var _this = this;
                    return function (results) {
                        var segments = lodash_1.default.map(results, function (segment) {
                            return _this.uiSegmentSrv.newSegment({ value: segment.text, expandable: segment.expandable });
                        });
                        if (addTemplateVars) {
                            for (var _i = 0, _a = _this.templateSrv.variables; _i < _a.length; _i++) {
                                var variable = _a[_i];
                                segments.unshift(_this.uiSegmentSrv.newSegment({
                                    type: 'template', value: '/^$' + variable.name + '$/', expandable: true
                                }));
                                segments.unshift(_this.uiSegmentSrv.newSegment({
                                    type: 'template', value: '$' + variable.name, expandable: true
                                }));
                            }
                        }
                        return segments;
                    };
                };
                SqlQueryCtrl.prototype.getTagsOrValues = function (segment, index) {
                    var _this = this;
                    if (segment.type === 'condition') {
                        return this.$q.when([
                            this.uiSegmentSrv.newSegment('AND'), this.uiSegmentSrv.newSegment('OR')
                        ]);
                    }
                    if (segment.type === 'operator') {
                        var nextValue = this.tagSegments[index + 1].value;
                        if (/^\/.*\/$/.test(nextValue)) {
                            return this.$q.when(this.uiSegmentSrv.newOperators([
                                this.matchOperators.match, this.matchOperators.not
                            ]));
                        }
                        else {
                            return this.$q.when(this.uiSegmentSrv.newOperators([
                                '=', '<>', '<', '>'
                            ]));
                        }
                    }
                    var query, addTemplateVars;
                    if (segment.type === 'key' || segment.type === 'plus-button') {
                        query = this.queryBuilder.buildExploreQuery('TAG_KEYS');
                        addTemplateVars = false;
                    }
                    else if (segment.type === 'value') {
                        query = this.queryBuilder.buildExploreQuery('TAG_VALUES', this.tagSegments[index - 2].value);
                        addTemplateVars = true;
                    }
                    return this.datasource.metricFindQuery(query)
                        .then(this.transformToSegments(addTemplateVars))
                        .then(function (results) {
                        if (segment.type === 'key') {
                            results.splice(0, 0, angular_1.default.copy(_this.removeTagFilterSegment));
                        }
                        return results;
                    })
                        .catch(this.handleQueryError.bind(this));
                };
                SqlQueryCtrl.prototype.getFieldSegments = function () {
                    var fieldsQuery = this.queryBuilder.buildExploreQuery('TAG_KEYS');
                    return this.datasource.metricFindQuery(fieldsQuery)
                        .then(this.transformToSegments(false))
                        .catch(this.handleQueryError);
                };
                SqlQueryCtrl.prototype.tagSegmentUpdated = function (segment, index) {
                    this.tagSegments[index] = segment;
                    // handle remove tag condition
                    if (segment.value === this.removeTagFilterSegment.value) {
                        this.tagSegments.splice(index, 3);
                        if (this.tagSegments.length === 0) {
                            this.tagSegments.push(this.uiSegmentSrv.newPlusButton());
                        }
                        else if (this.tagSegments.length > 2) {
                            this.tagSegments.splice(Math.max(index - 1, 0), 1);
                            if (this.tagSegments[this.tagSegments.length - 1].type !== 'plus-button') {
                                this.tagSegments.push(this.uiSegmentSrv.newPlusButton());
                            }
                        }
                    }
                    else {
                        if (segment.type === 'plus-button') {
                            if (index > 2) {
                                this.tagSegments.splice(index, 0, this.uiSegmentSrv.newCondition('AND'));
                            }
                            this.tagSegments.push(this.uiSegmentSrv.newOperator('='));
                            this.tagSegments.push(this.uiSegmentSrv.newFake('select tag value', 'value', 'query-segment-value'));
                            segment.type = 'key';
                            segment.cssClass = 'query-segment-key';
                        }
                        if ((index + 1) === this.tagSegments.length) {
                            this.tagSegments.push(this.uiSegmentSrv.newPlusButton());
                        }
                    }
                    this.rebuildTargetTagConditions();
                };
                SqlQueryCtrl.prototype.rebuildTargetTagConditions = function () {
                    var _this = this;
                    var tags = [];
                    var tagIndex = 0;
                    var tagOperator = "";
                    lodash_1.default.each(this.tagSegments, function (segment2, index) {
                        if (segment2.type === 'key') {
                            if (tags.length === 0) {
                                tags.push({});
                            }
                            tags[tagIndex].key = segment2.value;
                        }
                        else if (segment2.type === 'value') {
                            tagOperator = _this.getTagValueOperator(segment2.value, tags[tagIndex].operator);
                            if (tagOperator) {
                                _this.tagSegments[index - 1] = _this.uiSegmentSrv.newOperator(tagOperator);
                                tags[tagIndex].operator = tagOperator;
                            }
                            tags[tagIndex].value = segment2.value;
                        }
                        else if (segment2.type === 'condition') {
                            tags.push({ condition: segment2.value });
                            tagIndex += 1;
                        }
                        else if (segment2.type === 'operator') {
                            tags[tagIndex].operator = segment2.value;
                        }
                    });
                    this.target.tags = tags;
                    this.panelCtrl.refresh();
                };
                SqlQueryCtrl.prototype.getTagValueOperator = function (tagValue, tagOperator) {
                    if (tagOperator !== this.matchOperators.match &&
                        tagOperator !== this.matchOperators.not &&
                        /^\/.*\/$/.test(tagValue)) {
                        return this.matchOperators.match;
                    }
                    else if ((tagOperator === this.matchOperators.match ||
                        tagOperator === this.matchOperators.not) &&
                        /^(?!\/.*\/$)/.test(tagValue)) {
                        return '=';
                    }
                };
                SqlQueryCtrl.prototype.getCollapsedText = function () {
                    return this.queryModel.render(false);
                };
                SqlQueryCtrl.templateUrl = 'partials/query.editor.html';
                return SqlQueryCtrl;
            })(sdk_1.QueryCtrl);
            exports_1("SqlQueryCtrl", SqlQueryCtrl);
        }
    }
});
//# sourceMappingURL=query_ctrl.js.map