Ext.define('Ext.ux.form.MultiSearchField', {
    extend: 'Ext.form.field.Trigger',
    alias: 'widget.multisearchfield',
    trigger1Cls: Ext.baseCSSPrefix + 'form-clear-trigger',
    trigger2Cls: Ext.baseCSSPrefix + 'form-search-trigger',
    hasSearch: false,
    paramName: 'query',
    // Substitui o me.store.proxy.filterParam quando for aplicar o filtro
    replaceParamName: false,
    mixins: [
        'Ext.ux.form.AbstractSearchField'
    ],
    config: {
        searchAll: true
    },
    constructor: function() {
        var me = this;
        me.addEvents('clear', 'beforeclear', 'aftersearch', 'beforesearch');
        this.callParent(arguments);
        me.store.remoteFilter = true;
        if (!me.store.searchFields) {
            me.store.searchFields = new Ext.util.MixedCollection();
        }
        me.store.searchFields.add(me.paramName, me);
        if (!me.store.hasEvents) {
            me.store.on('beforeload', this.onBeforeLoad, me);
            me.store.on('load', this.onLoad, me);
            me.store.hasEvents = true;
        }
        me.store.proxy.encodeFilters = function(filters) {
            return filters[0].value;
        };
    },
    initComponent: function() {
        var me = this;
        me.callParent(arguments);
        me.on('specialkey', function(f, e) {
            if (e.getKey() === e.ENTER) {
                me.onTrigger2Click();
            }
        }, me);
        me.on('specialkey', function(f, e) {
            if (e.getKey() === e.ESC) {
                me.onTrigger1Click();
            }
        }, me);
    },
    afterRender: function() {
        this.callParent(arguments);
        this.triggerCell.item(0).setDisplayed(false);
    },
    onTrigger1Click: function() {
        var me = this,
                store = me.store,
                proxy = store.getProxy(),
                value = me.getValue(),
                searchField = store.searchFields.get(me.paramName);

        if (me.hasSearch) {
            this.clearParam();
            me.fireEvent('beforeclear', me);
            searchField.mask();
            me.store.currentPage = 1;
            store.load({
                callback: function(rs, o, s) {
                    if (s) {
                        this.hasSearch = false;
                        this.triggerCell.item(0).setDisplayed(false);
                        this.updateLayout();
                        this.fireEvent('clear', this);
                    }
                    this.unmask();
                },
                scope: searchField
            });
        }
    },
    onTrigger2Click: function() {
        var me = this,
                store = me.store,
                proxy = store.getProxy(),
                value = me.getValue(),
                searchField = store.searchFields.get(me.paramName);

        if (!Ext.isEmpty(value)) {
            Ext.applyIf(proxy.extraParams, {});
            if (me.config.searchAll) {
                me.store.searchFields.eachKey(function(paramName, item, index) {
                    if (!Ext.isEmpty(item.getValue())) {
                        proxy.extraParams[paramName] = Ext.util.Format.htmlEncode(item.getValue());
                        item.mask();
                        if (paramName !== me.paramName) {
                            item.hasSearch = true;
                            if (item.triggerCell) {
                                item.triggerCell.item(0).setDisplayed(true);
                            }
                            item.updateLayout();
                        }
                    } else {
                        if (item.hasSearch) {
                            item.setValue(null);
                            delete proxy.extraParams[item.paramName];
                            item.fireEvent('beforeclear', item);
                            item.hasSearch = false;
                            item.triggerCell.item(0).setDisplayed(false);
                            item.updateLayout();
                            item.fireEvent('clear', item);
                        }
                    }
                }, me);
            }
            me.fireEvent('beforesearch', me);
            me.store.on('load', function() {
                me.fireEvent('aftersearch', me);
            }, this);
            me.store.currentPage = 1;
            me.store.load({
                callback: function(rs, o, s) {
                    if (s) {
                        this.hasSearch = true;
                        this.triggerCell.item(0).setDisplayed(true);
                        this.updateLayout();
                    }
                    if (this.config.searchAll) {
                        this.store.searchFields.each(function(item, index) {
                            if (!Ext.isEmpty(item.getValue())) {
                                item.unmask();
                            }
                        });
                    }
                },
                scope: this
            });
        }
    },
    reset: function() {
        this.onTrigger1Click();
    },
    clearParam: function() {
        var me = this,
                store = me.store,
                proxy = store.getProxy();
        this.setValue(null);
        delete proxy.extraParams[me.paramName];
    }
});