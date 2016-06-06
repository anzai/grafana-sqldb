///<reference path="app/headers/common.d.ts" />
System.register(['lodash'], function(exports_1) {
    var lodash_1;
    var index, categories, groupByTimeFunctions, QueryPartDef, QueryPart;
    function functionRenderer(part, innerExpr) {
        var str = part.def.type + '(';
        var parameters = lodash_1.default.map(part.params, function (value, index) {
            var paramType = part.def.params[index];
            if (paramType.type === 'time') {
                if (value === 'auto') {
                    value = '$interval';
                }
            }
            if (paramType.quote === 'single') {
                return "'" + value + "'";
            }
            else if (paramType.quote === 'double') {
                return '"' + value + '"';
            }
            return value;
        });
        if (innerExpr) {
            parameters.unshift(innerExpr);
        }
        return str + parameters.join(', ') + ')';
    }
    function aliasRenderer(part, innerExpr) {
        return innerExpr + ' AS ' + '"' + part.params[0] + '"';
    }
    function suffixRenderer(part, innerExpr) {
        return innerExpr + ' ' + part.params[0];
    }
    function identityRenderer(part, innerExpr) {
        return part.params[0];
    }
    function quotedIdentityRenderer(part, innerExpr) {
        return '"' + part.params[0] + '"';
    }
    function fieldRenderer(part, innerExpr) {
        return part.params[0];
    }
    function replaceAggregationAddStrategy(selectParts, partModel) {
        // look for existing aggregation
        for (var i = 0; i < selectParts.length; i++) {
            var part = selectParts[i];
            if (part.def.category === categories.Aggregations) {
                selectParts[i] = partModel;
                return;
            }
            if (part.def.category === categories.Selectors) {
                selectParts[i] = partModel;
                return;
            }
        }
        selectParts.splice(1, 0, partModel);
    }
    function addMathStrategy(selectParts, partModel) {
        var partCount = selectParts.length;
        if (partCount > 0) {
            // if last is math, replace it
            if (selectParts[partCount - 1].def.type === 'math') {
                selectParts[partCount - 1] = partModel;
                return;
            }
            // if next to last is math, replace it
            if (selectParts[partCount - 2].def.type === 'math') {
                selectParts[partCount - 2] = partModel;
                return;
            }
            else if (selectParts[partCount - 1].def.type === 'alias') {
                selectParts.splice(partCount - 1, 0, partModel);
                return;
            }
        }
        selectParts.push(partModel);
    }
    function addAliasStrategy(selectParts, partModel) {
        var partCount = selectParts.length;
        if (partCount > 0) {
            // if last is alias, replace it
            if (selectParts[partCount - 1].def.type === 'alias') {
                selectParts[partCount - 1] = partModel;
                return;
            }
        }
        selectParts.push(partModel);
    }
    function addFieldStrategy(selectParts, partModel, query) {
        // copy all parts
        var parts = lodash_1.default.map(selectParts, function (part) {
            return new QueryPart({ type: part.def.type, params: lodash_1.default.clone(part.params) });
        });
        query.selectModels.push(parts);
    }
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            }],
        execute: function() {
            index = [];
            categories = {
                Aggregations: [],
                Selectors: [],
                Math: [],
                Aliasing: [],
                Fields: [],
            };
            groupByTimeFunctions = [];
            QueryPartDef = (function () {
                function QueryPartDef(options) {
                    this.type = options.type;
                    this.params = options.params;
                    this.defaultParams = options.defaultParams;
                    this.renderer = options.renderer;
                    this.category = options.category;
                    this.addStrategy = options.addStrategy;
                }
                QueryPartDef.register = function (options) {
                    index[options.type] = new QueryPartDef(options);
                    options.category.push(index[options.type]);
                };
                return QueryPartDef;
            })();
            QueryPartDef.register({
                type: 'field',
                addStrategy: addFieldStrategy,
                category: categories.Fields,
                params: [{ type: 'field', dynamicLookup: true }],
                defaultParams: ['value'],
                renderer: fieldRenderer,
            });
            // Aggregations
            QueryPartDef.register({
                type: 'count',
                addStrategy: replaceAggregationAddStrategy,
                category: categories.Aggregations,
                params: [],
                defaultParams: [],
                renderer: functionRenderer,
            });
            QueryPartDef.register({
                type: 'avg',
                addStrategy: replaceAggregationAddStrategy,
                category: categories.Aggregations,
                params: [],
                defaultParams: [],
                renderer: functionRenderer,
            });
            QueryPartDef.register({
                type: 'sum',
                addStrategy: replaceAggregationAddStrategy,
                category: categories.Aggregations,
                params: [],
                defaultParams: [],
                renderer: functionRenderer,
            });
            // transformations
            QueryPartDef.register({
                type: 'time',
                category: groupByTimeFunctions,
                params: [{ name: "interval", type: "time", options: ['auto', '1s', '10s', '1m', '5m', '10m', '15m', '1h'] }],
                defaultParams: ['auto'],
                renderer: functionRenderer,
            });
            // Selectors
            QueryPartDef.register({
                type: 'max',
                addStrategy: replaceAggregationAddStrategy,
                category: categories.Selectors,
                params: [],
                defaultParams: [],
                renderer: functionRenderer,
            });
            QueryPartDef.register({
                type: 'min',
                addStrategy: replaceAggregationAddStrategy,
                category: categories.Selectors,
                params: [],
                defaultParams: [],
                renderer: functionRenderer,
            });
            QueryPartDef.register({
                type: 'tag',
                category: groupByTimeFunctions,
                params: [{ name: 'tag', type: 'string', dynamicLookup: true }],
                defaultParams: ['tag'],
                renderer: fieldRenderer,
            });
            QueryPartDef.register({
                type: 'math',
                addStrategy: addMathStrategy,
                category: categories.Math,
                params: [{ name: "expr", type: "string" }],
                defaultParams: [' / 100'],
                renderer: suffixRenderer,
            });
            QueryPartDef.register({
                type: 'alias',
                addStrategy: addAliasStrategy,
                category: categories.Aliasing,
                params: [{ name: "name", type: "string", quote: 'double' }],
                defaultParams: ['alias'],
                renderMode: 'suffix',
                renderer: aliasRenderer,
            });
            QueryPart = (function () {
                function QueryPart(part) {
                    this.part = part;
                    this.def = index[part.type];
                    if (!this.def) {
                        throw { message: 'Could not find query part ' + part.type };
                    }
                    part.params = part.params || lodash_1.default.clone(this.def.defaultParams);
                    this.params = part.params;
                    this.updateText();
                }
                QueryPart.prototype.render = function (innerExpr) {
                    return this.def.renderer(this, innerExpr);
                };
                QueryPart.prototype.hasMultipleParamsInString = function (strValue, index) {
                    if (strValue.indexOf(',') === -1) {
                        return false;
                    }
                    return this.def.params[index + 1] && this.def.params[index + 1].optional;
                };
                QueryPart.prototype.updateParam = function (strValue, index) {
                    // handle optional parameters
                    // if string contains ',' and next param is optional, split and update both
                    if (this.hasMultipleParamsInString(strValue, index)) {
                        lodash_1.default.each(strValue.split(','), function (partVal, idx) {
                            this.updateParam(partVal.trim(), idx);
                        }, this);
                        return;
                    }
                    if (strValue === '' && this.def.params[index].optional) {
                        this.params.splice(index, 1);
                    }
                    else {
                        this.params[index] = strValue;
                    }
                    this.part.params = this.params;
                    this.updateText();
                };
                QueryPart.prototype.updateText = function () {
                    if (this.params.length === 0) {
                        this.text = this.def.type + '()';
                        return;
                    }
                    var text = this.def.type + '(';
                    text += this.params.join(', ');
                    text += ')';
                    this.text = text;
                };
                return QueryPart;
            })();
            exports_1("default",{
                create: function (part) {
                    return new QueryPart(part);
                },
                getCategories: function () {
                    return categories;
                },
                getMatchOperators: function (dbms) {
                    var rtn = null;
                    switch (dbms) {
                        case 'postgres':
                            rtn = { 'match': '~*', 'not': '!~*' };
                            break;
                        case 'mysql':
                            rtn = { 'match': 'REGEXP', 'not': 'NOT REGEXP' };
                            break;
                        default:
                            break;
                    }
                    ;
                    return rtn;
                },
            });
        }
    }
});
//# sourceMappingURL=query_part.js.map