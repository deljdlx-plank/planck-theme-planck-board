Planck.Extension.ViewComponent = {};
Planck.Extension.ViewComponent.View = {};

Planck.Extension.ViewComponent.View.Component = {};

;
Planck.Extension.ViewComponent.Component = function()
{

};



Planck.Extension.ViewComponent.Component.prototype.dataLayerSelector = '*[type="'+'application/json+planck-data'+'"]';
Planck.Extension.ViewComponent.Component.prototype.dataLayer = null;
Planck.Extension.ViewComponent.Component.prototype.subComponents = [];
Planck.Extension.ViewComponent.Component.prototype.$element = null;
Planck.Extension.ViewComponent.Component.prototype.$contentElement = null;




Planck.Extension.ViewComponent.Component.prototype.destroy = function()
{
    this.$element.remove();
};


Planck.Extension.ViewComponent.Component.prototype.onClick = function(callback)
{
   this.getElement().click(function() {
      callback(this);
   }.bind(this));
};


Planck.Extension.ViewComponent.Component.prototype.on = function(eventName, callback)
{
   this.events[eventName] = callback;
   return this;
};



Planck.Extension.ViewComponent.Component.prototype.setElement = function(selector)
{
    this.$element = $(selector);
    this.$contentElement = this.$element.find('> .plk-component-content');
    this.initialize();
};

Planck.Extension.ViewComponent.Component.prototype.getElement = function()
{
    if(this.$element) {
        return this.$element;
    }
    console.log('no element');

};





Planck.Extension.ViewComponent.Component.prototype.initialize = function()
{

    this.loadDataLayerFromDom();
    this.$element.data('component', this);
    this.$element.data('initialized', true);
    this.loadSubComponents();


};

Planck.Extension.ViewComponent.Component.prototype.loadSubComponents = function()
{
    this.$element.find('.plk-component').each(function(index, item) {

        if($(item).data('initialized')) {
            return;
        }

        var componentName = item.getAttribute('data-component-name');

        if(componentName) {
            var instance = Planck.getConstructor(componentName);
            if(instance) {
                var component = new instance();
                component.setElement(item);

                if(!isset(this.subComponents[componentName])) {
                    this.subComponents[componentName] = [];
                }

                this.subComponents[componentName].push(component);
            }
        }
    }.bind(this));

};





Planck.Extension.ViewComponent.Component.prototype.getToolbar = function()
{

    if(this.toolbar) {
        return this.toolbar;
    }

    var toolbar = this.$element.find('.plk-component.plk-toolbar');

    if(toolbar.length) {

        var toolbarComponent = toolbar.data('component');
        if(!toolbarComponent) {
            toolbarComponent = new Planck.Extension.ViewComponent.View.Component.Toolbar();
            toolbarComponent.setElement(toolbar);
            toolbarComponent.initialize();
        }
        this.toolbar = toolbarComponent;

        return this.toolbar;
    }
    this.toolbar = new Planck.Extension.ViewComponent.View.Component.Toolbar();
    return this.toolbar;

};






Planck.Extension.ViewComponent.Component.prototype.addRemoteCallData = function(key, value)
{
    if(!this.remoteCallData) {
        this.remoteCallData = {};
    }
    this.remoteCallData[key] = value;
    return this;
};



Planck.Extension.ViewComponent.Component.prototype.getRemoteCallInstance = function(componentName)
{
    var remoteCall = new Planck.Extension.ViewComponent.RemoteComponentLoader(componentName);
    remoteCall.addData('dataLayer', this.getDataLayer().serialize());


    return remoteCall;
};


Planck.Extension.ViewComponent.Component.prototype.getViewFromRemote = function(componentName, data, callback)
{

    var remoteCall = this.getRemoteCallInstance(componentName);
    if(data) {
        for(var key in data) {
            var value = data[key];
            remoteCall.addData(key, value);
        }
    }

    remoteCall.load(function(descriptor) {

        var dom = $(descriptor.getHTML());
        this.setElement(dom);

        if(callback) {
            callback(descriptor);
        }

    }.bind(this));

};





Planck.Extension.ViewComponent.Component.prototype.setDataLayer = function(dataLayer)
{
   this.dataLayer = dataLayer;
   var entries = this.dataLayer.getEntries();
   for(var name in entries) {

       if(isset(this[name])) {
           this[name] =  this.dataLayer.get(name);
       }
   }
    return this;
};

Planck.Extension.ViewComponent.Component.prototype.getDataLayer = function()
{
    if(!this.dataLayer) {
        this.dataLayer = new Planck.DataLayer();
    }
    return this.dataLayer;
};

Planck.Extension.ViewComponent.Component.prototype.loadDataLayerFromDom = function()
{

    var dalaLayers = this.$element.find(this.dataLayerSelector);

    dalaLayers.each(function(index, dataLayer) {
        var json = $(dataLayer).text();

        try {
            var data = JSON.parse(json);
        }
        catch(exception) {
            console.log(exception);
        }

        this.loadDataLayer(data);

    }.bind(this));

    return this;
};

Planck.Extension.ViewComponent.Component.prototype.loadDataLayer = function(data)
{

    for(var name in data) {

        this.getDataLayer().set(name, data[name]);



        if(isset(this[name])) {
            this[name] = this.getDataLayer().get(name);
        }
    }
};













;
Planck.Extension.ViewComponent.ComponentDescriptor = function()
{

    this.html = '';
    this.javascripts = [];
    this.css = [];

};


Planck.Extension.ViewComponent.ComponentDescriptor.prototype.setJavascripts =  function(javascripts)
{
    this.javascripts = javascripts;
    return this;
};

Planck.Extension.ViewComponent.ComponentDescriptor.prototype.setCSS =  function(css)
{
    this.css = css;
    return this;
};


Planck.Extension.ViewComponent.ComponentDescriptor.prototype.setHTML =  function(html)
{
    this.html = html;
    return this;
};


Planck.Extension.ViewComponent.ComponentDescriptor.prototype.getHTML = function()
{
    return this.html;
};


Planck.Extension.ViewComponent.ComponentDescriptor.prototype.loadResources = function(callback)
{


    for(var i=0; i<this.css.length; i++) {

        var src = this.css[i];

        if(!$('head').find('link[href="'+src+'"]').length) {

            $('head').append('<link rel="stylesheet" href="'+src+'"/>');
        }
    }

    var index = 0;

    var load = function(data, textStatus, jqxhr)
    {

        var url = this.javascripts[index];

        index++;

        if($('script[src="'+url+'"]').length) {
            if(index >= this.javascripts.length) {
                callback(this);
                return;
            }
            else {
                load();
                return;
            }
        }

        if(url) {
            $.getScript(url, load).fail(function (jqxhr, settings, exception) {
                console.log(exception)
            });
        }
        else {

            callback(this);
        }
    }.bind(this);
    load();






};





;
Planck.Extension.ViewComponent.RemoteComponentLoader = function(componentName)
{
    this.remoteComponentName = componentName;

    this.serviceURL = '?/view-component/remote-rendering/render';


    this.calls = {};
    this.data = {}

};

Planck.Extension.ViewComponent.RemoteComponentLoader.packageDescriptorLoaded = false;
Planck.Extension.ViewComponent.RemoteComponentLoader.loadedAssets = {};



Planck.Extension.ViewComponent.RemoteComponentLoader.setLoadedAssets = function(assets)
{
    Planck.Extension.ViewComponent.RemoteComponentLoader.loadedAssets = assets;
};






Planck.Extension.ViewComponent.RemoteComponentLoader.prototype.addData = function(key, value)
{
   this.data[key] = value;
   return this;

};

Planck.Extension.ViewComponent.RemoteComponentLoader.prototype.addMethodCall = function(callName, parameters)
{
    this.calls[callName] = parameters;
    return this;
};


Planck.Extension.ViewComponent.RemoteComponentLoader.prototype.load = function(callback)
{

    if(!Planck.Extension.ViewComponent.RemoteComponentLoader.packageDescriptorLoaded) {
        this.loadPackageDescriptor(function(callback) {
            this.loadComponent(callback);
        }.bind(this));
    }
    else {
        this.loadComponent(callback);
    }
};

Planck.Extension.ViewComponent.RemoteComponentLoader.prototype.loadPackageDescriptor = function(callback)
{

    var url = '?/@extension/planck-extension-view_component/RemoteRendering/api[get-package]';
    var data = {
    };
    Planck.ajax({
        url: url,
        method: 'get',
        data: data,
        success: function(response) {
            Planck.Extension.ViewComponent.RemoteComponentLoader.loadedAssets = response;
            Planck.Extension.ViewComponent.RemoteComponentLoader.packageDescriptorLoaded = true;


            this.loadComponent(callback());
        }.bind(this)
    });


};



Planck.Extension.ViewComponent.RemoteComponentLoader.prototype.loadComponent = function(callback)
{

    var url = this.serviceURL;
    var data = {
        component: this.remoteComponentName,
        calls: this.calls
    };

    for(var key in this.data) {
        data[key] = this.data[key];
    }


    Planck.ajax({
        url: url,
        method: 'post',
        data: data,
        success: function(response) {

            var descriptor = new Planck.Extension.ViewComponent.ComponentDescriptor();

            descriptor.setHTML(response.html);
            descriptor.setCSS(response.css);


            var javascriptToLoad = [];

            for(var i = 0 ; i<response.javascripts.length; i++) {


                var javascript = response.javascripts[i];

                if(!isset(Planck.Extension.ViewComponent.RemoteComponentLoader.loadedAssets.javascripts[javascript])) {
                    javascriptToLoad.push(javascript);
                }

            }
            descriptor.setJavascripts(javascriptToLoad);

            descriptor.loadResources(function() {
                console.log(callback);
                if(callback) {
                    callback(descriptor);
                }
            }.bind(this));

        }.bind(this)
    });
};




















;
Planck.Extension.ViewComponent.View.Component.Confirm = function(container)
{
    this.events = {
        confirm : function() {

        },
        cancel: function() {

        }
    };

    this.confirmCaption = i18n('Confirmer');
    this.cancelCaption = i18n('Annuler');
    this.message = i18n('Confirmer ?')


    this.$container = $(container);

    this.$element = $(
        '<div class="plk-component plk-confirm">'+

            '<div class="plk-content">'+
                '<div class="plk-message">'+
                    this.message+
                '</div>'+
                '<div class="plk-footer">'+
                    '<button class="confirm-trigger">'+this.confirmCaption+'</button>'+
                    ' <button class="cancel-trigger">'+this.cancelCaption+'</button>'+
                '</div>'+
            '</div>'+

        '</div>' +
        ''
    );

    this.$element.find('.confirm-trigger').click(function(event) {
        this.events.confirm();
        this.hide();
    }.bind(this));

    this.$element.find('.cancel-trigger').click(function(event) {
        this.hide();
    }.bind(this));

    this.$container.append(this.$element);
};


Planck.Extension.ViewComponent.View.Component.Confirm.prototype.onConfirm = function(callback)
{
   this.events.confirm = callback;
};


Planck.Extension.ViewComponent.View.Component.Confirm.prototype.show = function()
{
    this.$element.show();
};

Planck.Extension.ViewComponent.View.Component.Confirm.prototype.hide = function()
{
    this.$element.hide();
};


;
Planck.Extension.ViewComponent.View.Component.EntityTree = function(options)
{

    this.options = {
        newNodeCaption: i18n('Nouveau'),
        sourceURL: '',
        createNodeURL: '',
        renameNodeURL: '',
        moveNodeURL: '',
        deleteURL: '',
        deleteBranchURL: '',

        editable: true,
    };

    $.extend(this.options, options);

    this.selector;
    this.tree;

    this.editionEnable = this.options.editable;
    this.deleteEnable = true;
    this.moveEnable = true;



    this.selectedNode;

    this.events = {
       select: function(data) {
           //console.log(data);
       }.bind(this),
        ready: function(data) {
            //console.log(data);
        }.bind(this),
        create: function(data) {
            //console.log(data);
        }.bind(this),
        load: function(data) {
            //console.log(data)
        }.bind(this)
    };

};

Planck.Extension.ViewComponent.View.Component.EntityTree.prototype.on = function(eventName, callback)
{
   this.events[eventName] = callback;
   return this;
};


Planck.Extension.ViewComponent.View.Component.EntityTree.prototype.selectNodeById = function(nodeId)
{
    return this.getTree().jstree('select_node', nodeId);
};


Planck.Extension.ViewComponent.View.Component.EntityTree.prototype.render = function(selector)
{

    this.selector = selector;

    this.tree = $(selector).jstree(this.getOptions())
    .on('select_node.jstree', function(e, data) {
        this.selectedNode = data.node;
        return this.events.select(data);
    }.bind(this))
    .on('ready.jstree', function(data) {
        return this.events.ready(data);
    }.bind(this))
    .on('loaded.jstree', function(data) {
        this.events.load(data);
    }.bind(this))
    ;

    this.jsTree = $(this.selector).jstree(true);


    //console.log(this.selector);
    //console.log($(this.selector).jstree(true));





    if(this.editionEnable) {
        this.bindRenameEvent();
    }

    if(this.moveEnable) {
        this.bindMoveEvent();
    }


    if(this.deleteEnable) {
        this.bindRemoveEvent();
        //this.deleteBranch();
    }

};

Planck.Extension.ViewComponent.View.Component.EntityTree.prototype.getValue = function()
{
    return this.selectedNode;
};



Planck.Extension.ViewComponent.View.Component.EntityTree.prototype.getOptions = function()
{

    var options = {
        'core': {
            'data': {
                "url": function (node) {
                    var url = this.options.sourceURL;
                    return url;
                }.bind(this),
                'data': function (node) {
                    return {
                        'id': node.id,
                        //'entityName': this.entityName
                    };
                }.bind(this),
            },
            "check_callback": true
        },
        "plugins": ["dnd", "search"/*, "checkbox"*/],
        'search': {
            'case_insensitive' : true,
            'ajax':  {
                url: '?/product/api/searchInTree',
                data : {
                    entityName: this.entityName
                },
                success: function(data) {
                    console.log(data);
                }.bind(this)
            }
        }
    };


    if(this.editionEnable) {

        options.plugins.push("contextmenu");


        options.contextmenu = {
            'items': function($node) {
                var tree = $(this.selector).jstree(true);
                return this.getContextMenu($node);

            }.bind(this)
        };
    }


    return options;
};


Planck.Extension.ViewComponent.View.Component.EntityTree.prototype.reloadNode = function (nodeId) {
    this.tree = $(this.selector).jstree(true).refresh_node(nodeId);
    return this;
};




Planck.Extension.ViewComponent.View.Component.EntityTree.prototype.deleteBranch = function(node)
{

    var url = this.options.deleteBranchURL;
    Planck.ajax({
        url: url,
        method: 'delete',
        data: node.data,
        success: function(data) {
            this.reloadNode(node.data.parent_id);
        }.bind(this)
    });
};





Planck.Extension.ViewComponent.View.Component.EntityTree.prototype.createNode = function(parentNode)
{


    var url = this.options.createNodeURL;
    Planck.ajax({
        url : url,
        method: 'post',
        data : {
            parent_id : parentNode.id,
            name: this.options.newNodeCaption
            //entityName: this.entityName
        },
        success: function (data) {
            var tree = this.jsTree;

            var newNode = data;


            tree.create_node(parentNode, newNode);

            this.events.create(newNode);
            tree.edit(newNode);
        }.bind(this)
    })
};

Planck.Extension.ViewComponent.View.Component.EntityTree.prototype.bindRenameEvent = function()
{


    this.getTree().on('rename_node.jstree', function(e, data) {

        var newName = data.text;

        var data = data.node.data;
        data['name'] = newName;

        var url = this.options.renameNodeURL;
        Planck.ajax({
            url: url,
            method: 'post',
            data: data,
            success: function(data) {
                console.log(data);
            }
        });

    }.bind(this))
};




Planck.Extension.ViewComponent.View.Component.EntityTree.prototype.bindMoveEvent = function()
{
    this.getTree().on('move_node.jstree', function(e, data) {
        var movedNode = data.node;
        var newParentId = data.parent;

        var nodeData = movedNode.data;
        nodeData['parent_id'] = newParentId;


        var url = this.options.moveNodeURL;

        Planck.ajax({
            url: url,
            method: 'post',
            data: nodeData,
            success: function(data) {
                console.log(data);
            }
        });
    }.bind(this))
};




Planck.Extension.ViewComponent.View.Component.EntityTree.prototype.bindRemoveEvent = function()
{
    this.getTree().on('delete_node.jstree', function(e, data) {


        console.log(data.node.data);


        var url = this.options.deleteURL;
        Planck.ajax({
            url: url,
            method: 'delete',
            data: data.node.data,
            success: function(data) {
                console.log(data);
            }
        });

    }.bind(this))
};





Planck.Extension.ViewComponent.View.Component.EntityTree.prototype.getContextMenu = function($node)
{

    var tree = this.jsTree;

    console.log(tree);


    var menu =  {
        "Create": {
            "separator_before": false,
            "separator_after": false,
            "label": "Nouveau",
            "action": function (obj) {
                this.createNode($node);
            }.bind(this)
        },
        "Rename": {
            "separator_before": false,
            "separator_after": false,
            "label": "Renommer",
            "action": function (obj) {
                tree.edit($node);
            }
        },
    };

    if(this.deleteEnable) {
        menu["Remove"] = {
            "separator_before": false,
            "separator_after": false,
            "label": "Supprimer",
            "action": function (obj) {
                tree.delete_node($node);
            }
        };

        menu["RemoveAll"] = {
            "separator_before": true,
            "separator_after": false,
            "label": "Supprimer la branche",
            "action": function (obj) {
                this.deleteBranch($node);
            }.bind(this)
        };


    }


    return menu;
};



Planck.Extension.ViewComponent.View.Component.EntityTree.prototype.getTree = function()
{
    return this.tree;
    //
};


;
Planck.Extension.ViewComponent.View.Component.FloatingBox = function(target, element)
{
    this.$target = $(target);
    this.$element = $(element);

    this.$wrapper = $('<div class="plk-floating-box"></div>');

    this.$toolbar = $('<div class="plk-header-toolbar"></div>');
        this.$closeButton = $('<i class="plk-button fas fa-window-close"></i>');
    this.$toolbar.append(this.$closeButton);
    this.$wrapper.append(this.$toolbar);

    this.$contentContainer = $('<div class="plk-content"></div>');
        this.$contentContainer.append(this.$element);
    this.$wrapper.append(this.$contentContainer);


    this.$closeButton.click(function() {
        this.destroy();
    }.bind(this));
};




Planck.Extension.ViewComponent.View.Component.FloatingBox.prototype.getElement = function()
{
    return this.$element;
};


Planck.Extension.ViewComponent.View.Component.FloatingBox.prototype.show = function()
{
    $(document.body).append(this.$wrapper);

    var tether = new Tether({
        target: this.$target.get(0),
        element: this.$wrapper.get(0),
        attachment: 'top left',
        targetAttachment: 'top right',
        //offset: '0px 12px',
        targetOffset: '0px 12px',
    });
    tether.enable();

    this.$wrapper.show();
};


Planck.Extension.ViewComponent.View.Component.FloatingBox.prototype.destroy = function()
{
   this.$wrapper.remove();
};


;
Planck.Extension.ViewComponent.View.Component.Overlay = function()
{

    this.rendered = false;

    this.$element = $(
        '<div  class="plk-overlay" style="">'+
            '<i class="fas fa-window-close fa-2x plk-overlay-close"></i>'+
            '<div class="plk-overlay-content" style=""></div>'+
        '</div>'
    );

    this.$contentElement = this.$element.find('.plk-overlay-content');
    this.$closeButton =  this.$element.find('.plk-overlay-close');
    this.$closeButton.click(function() {
        this.hide();
    }.bind(this));
};

Planck.Extension.ViewComponent.View.Component.Overlay.prototype.getElement = function()
{
    return this.$element;
};


Planck.Extension.ViewComponent.View.Component.Overlay.prototype.getContentElement = function()
{
    return this.$contentElement;
};



Planck.Extension.ViewComponent.View.Component.Overlay.prototype.render = function(container)
{
    if(!this.rendered) {
        this.$container = $(container);
        this.$container.append(this.$element);
        this.rendered = true;
    }

};

Planck.Extension.ViewComponent.View.Component.Overlay.prototype.show = function(content)
{
    if(!this.rendered) {
        this.render(document.body);
    }
    this.$contentElement.html(content);
    this.$element.show();

    var echapHandler = $(document.body).keydown(function(event) {
        if(event.key === "Escape") {
            this.destroy();
            delete echapHandler;
        }
    }.bind(this));

};

Planck.Extension.ViewComponent.View.Component.Overlay.prototype.hide = function()
{
    this.$element.hide();
};

Planck.Extension.ViewComponent.View.Component.Overlay.prototype.destroy = function()
{
    this.$element.remove();
    delete this;
};


;
Planck.Extension.ViewComponent.View.Component.Toolbar = function(container)
{
    if(container) {
        this.setContainer(container);
        this.initialize();
    }
};


Planck.Extension.ViewComponent.View.Component.Toolbar.prototype.deleteButton;


Planck.Extension.ViewComponent.View.Component.Toolbar.prototype.initialize = function()
{
    this.deleteButton = this.$element.find('.plk-delete-trigger');
};


Planck.Extension.ViewComponent.View.Component.Toolbar.prototype.getDeleteButton = function()
{
    return this.deleteButton;
};



Planck.inherit(
    Planck.Extension.ViewComponent.View.Component.Toolbar,
    Planck.Extension.ViewComponent.Component
);





;

Planck.Extension.EntityEditor = {};
Planck.Extension.EntityEditor.View = {};
Planck.Extension.EntityEditor.View.Component = {};
Planck.Extension.EntityEditor.Module = {};
Planck.Extension.EntityEditor.Model = {};
Planck.Extension.EntityEditor.Model.Entity = {};
Planck.Extension.EntityEditor.Model.Repository = {};


/*
Planck.Extension.EntityEditor.View.Component.FakeManager = function(triggerElement)
{
   $(triggerElement).click(function() {
       console.log('clicked on entity chooser trigger');
   });
};
*/



Planck.Extension.EntityEditor.entityMapping = {
    //'Planck\\Extension\\Content\\Model\\Entity\\Image' : Planck.Extension.EntityEditor.View.Component.FakeManager
};



Planck.Extension.EntityEditor.initialize = function()
{
    return;

    $('.plk-entity-list-container').each(function(index, element) {
        var component = new Planck.Extension.EntityEditor.View.Component.EntityList(element);
        component.load();
    });


   $('.plk-entity-chooser').each(function(index, element) {


       var entityName = $(element).attr('data-entity-type');



       if(isset(Planck.Extension.EntityEditor.entityMapping[entityName])) {
            var component = new Planck.Extension.EntityEditor.entityMapping[entityName](element);
       }
       else {
           var component = new Planck.Extension.EntityEditor.View.Component.EntityChooser(element);
       }




   });
};
;

Planck.Extension.EntityEditor.Module.Entity = {
    Controller: {}
};

;
Planck.Extension.EntityEditor.Module.Entity.Controller.EntityManager = function(container)
{

    this.$container = $(container);
    this.$entityEditorContainer = this.$container.find('.plk-entity-editor-container');


    this.$entityListContainer = this.$container.find('.plk-entity-list-container');

    this.entityList;
    this.entityEditor;
};




Planck.Extension.EntityEditor.Module.Entity.Controller.EntityManager.prototype.initialize = function()
{

    this.entityList = new Planck.Extension.EntityEditor.View.Component.EntityList(this.$entityListContainer);

    this.entityList.on('itemClick', function(entityDescriptor) {
        this.loadEditorByEntityDescriptor(entityDescriptor);

        //this.renderEntityEditor();

    }.bind(this));


    this.entityList.load();


};

Planck.Extension.EntityEditor.Module.Entity.Controller.EntityManager.prototype.loadEditorByEntityDescriptor = function(descriptor)
{


    this.entityEditor = new Planck.Extension.EntityEditor.View.Component.EntityEditor(this.$entityEditorContainer);
    this.entityEditor.setEntity(descriptor.entity);
    this.entityEditor.load();

};






;
Planck.Extension.EntityEditor.View.Component.EntityChooser = function(triggerElement)
{

    this.model = new Planck.Model();


    this.$triggerElement = $(triggerElement);
    this.$triggerElement.hide();

    this.$label = this.getLabel();
    this.$label.html(i18n('<div class="button" data-behaviour="interactive"><span>'+this.$label.html()+'</span></div>'));


    this.$inputValue = $('<input name="'+this.$triggerElement.attr('name')+'" value="'+this.$triggerElement.val()+'" type="hidden"/>');
    this.$triggerElement.parent().append(this.$inputValue);

    this.$labelElement = $('<input readonly="readonly" data-behaviour="interactive"/>');
    this.$triggerElement.parent().append(this.$labelElement);


    this.entityType = this.$triggerElement.attr('data-entity-type');



    this.$label.click(function() {
        this.showEntitySelector();
    }.bind(this));

    this.$labelElement.click(function() {
        this.showEntitySelector();
    }.bind(this));


    this.loadPreview(this.$inputValue.val());



};


Planck.Extension.EntityEditor.View.Component.EntityChooser.prototype.loadPreview = function(value)
{
    if(!value) {
        return false;
    }


    var url = '?/@extension/planck-extension-entity_editor/entity/api[get]';
    var data = {
        entity: this.entityType,
        id: value
    };
    Planck.ajax({
        url: url,
        method: 'get',
        data: data,
        success: function(response) {

            var entity = this.model.getEntityByDescriptor(response);

            this.$labelElement.val(
               entity.getLabel()
            );

        }.bind(this)
    });




};



Planck.Extension.EntityEditor.View.Component.EntityChooser.prototype.getFloatingBox = function(descriptor)
{

    var $element = $(descriptor.getHTML());

    var floatingBox = new Planck.Extension.ViewComponent.View.Component.FloatingBox(
        this.$label,
        $element
    );


    floatingBox.getElement().css(
       'width',
        (this.$labelElement.get(0).offsetWidth - 32)    //lol
    );

    return floatingBox;

};


Planck.Extension.EntityEditor.View.Component.EntityChooser.prototype.showEntitySelector = function()
{

    var componentName = 'Planck\\Extension\\EntityEditor\\View\\Component\\EntityList';

    var componentLoader = new Planck.Extension.ViewComponent.RemoteComponentLoader(
        componentName
    );

    componentLoader.addMethodCall('loadRepositoryByEntityName', [
        this.entityType
    ]);

    componentLoader.load(function(descriptor) {

        var $floatingBox  = this.getFloatingBox(descriptor);
        $floatingBox.show();



        var list = new Planck.Extension.EntityEditor.View.Component.EntityList(
            $floatingBox.getElement()
        );

        list.on('itemClick', function(descriptor) {



            this.$inputValue.val(descriptor.entity.getId());
            this.$labelElement.val(descriptor.entity.getLabel());

            $floatingBox.destroy();
        }.bind(this));
        list.load(0, function() {
        }.bind(this));

    }.bind(this));



};


Planck.Extension.EntityEditor.View.Component.EntityChooser.prototype.getLabel = function()
{
    return this.$triggerElement.parents('.plk-field-container').find('label');
};

;
Planck.Extension.EntityEditor.View.Component.EntityEditor = function(container)
{
    //this.entity = entity;

    this.$container = $(container);

};

Planck.Extension.EntityEditor.View.Component.EntityEditor.prototype.setEntity = function(entity)
{
    this.entity = entity;
};





Planck.Extension.EntityEditor.View.Component.EntityEditor.prototype.load = function()
{


    var componentLoader = new Planck.Extension.ViewComponent.RemoteComponentLoader('Planck\\Extension\\EntityEditor\\View\\Component\\EntityEditor');
    componentLoader.addMethodCall(
        'loadEntityByAttributes',
        [
            this.entity.getType(),
            this.entity.getValues(true)
        ]
    );

    componentLoader.load(function(componentLoaderDescriptor) {

        this.renderEntityEditor(
            componentLoaderDescriptor.getHTML()
        );
    }.bind(this));
};




Planck.Extension.EntityEditor.View.Component.EntityEditor.prototype.renderEntityEditor = function(content)
{


    this.$container.html(content);


    this.$container.find('.plk-entity-chooser').each(function(index, element) {



        var entityName = $(element).attr('data-entity-type');

        if(isset(Planck.Extension.EntityEditor.entityMapping[entityName])) {
            var component = new Planck.Extension.EntityEditor.entityMapping[entityName](element);
        }
        else {
            var component = new Planck.Extension.EntityEditor.View.Component.EntityChooser(element);
        }
    });
};


;
Planck.Extension.EntityEditor.View.Component.EntityList = function (container) {
    this.$container = $(container);
    this.$list = this.$container.find('.plk-entity-list');
    this.$pagination = this.$container.find('.plk-pagination');

    this.entityType = this.$container.attr('data-entity-type');
    this.entityLabel = this.$container.attr('data-entity-label');


    this.currentSegmentIndex = 0;

    this.segmentSize = 16;


    this.toolbar = null;
    this.decorateContainer();


    this.services = {
        getEntities: {
            url: '?/@extension/planck-extension-entity_editor/entity/api[search]'
        }
    };

    this.events = {
        itemClick: function (entityDescriptor) {
            console.log(entityDescriptor);
        },
        itemLoad: function () {

        }
    };

    this.search = '';


};

Planck.Extension.EntityEditor.View.Component.EntityList.prototype.getEntityType = function () {
    return this.entityType;
};

Planck.Extension.EntityEditor.View.Component.EntityList.prototype.decorateContainer = function ()
{

    this.toolbar = new Planck.Extension.EntityEditor.View.Component.EntityListToolbar(this);

    this.toolbar.setTitle(this.entityLabel);

    this.toolbar.on('search', function (result) {

        console.log(this.toolbar);

        this.search = this.toolbar.getSearch();
        this.renderResultSet(result);
    }.bind(this));


    var $header = $('<div class="plk-header"></div>');
    $header.append(this.toolbar.getElement());

    this.$header = $header;

    this.$container.prepend(
        $header
    );
};


Planck.Extension.EntityEditor.View.Component.EntityList.prototype.on = function (event, callback) {
    this.events[event] = callback;
    return this;
};


Planck.Extension.EntityEditor.View.Component.EntityList.prototype.load = function (segmentIndex, callback) {

    if (!isset(segmentIndex)) {
        segmentIndex = 0;
    }

    var url = this.services.getEntities.url;

    var data = {
        entityType: this.entityType,
        search: this.search,
        limit: this.segmentSize,
        offset: (segmentIndex * this.segmentSize)
    };
    Planck.ajax({
        url: url,
        method: 'get',
        data: data,
        success: function (result) {

            this.renderResultSet(result);
            if(callback) {
                callback(result);
            }

        }.bind(this)
    });
};

Planck.Extension.EntityEditor.View.Component.EntityList.prototype.renderResultSet = function (result) {

    var segment = new Planck.Model.Segment(result);

    this.clearList();



    $(segment.getEntities()).each(function (index, entity) {
        this.renderRecord(entity);
    }.bind(this));

    this.currentSegmentIndex = result.metadata.segment.currentIndex;

    //console.log(result.metadata.segment)

    this.renderPagination(result.metadata.segment);

};


/**
 *
 * @param {Planck.Model.Entity} entityInstance
 */
Planck.Extension.EntityEditor.View.Component.EntityList.prototype.renderRecord = function (entityInstance) {


    var $tr = $('<tr></tr>');
    $tr.data('entity', entityInstance);


    $tr.attr('data-entity', entityInstance.toJSON());


    for (var attributeName in entityInstance.getValues()) {
        var value = entityInstance.getValue(attributeName);

        if(this.search) {
            var value = this.searchAndHighlight(value, this.search);
        }

        $tr.append('<td>' + value + '</td>');
    }

    //==================================================
    $tr.click(function (event) {

        var $element = $(event.target).parents('tr');


        var entity = $(event.target).parents('tr').data('entity');


        var data = {
            type: this.entityType,
            entity: entity,
        };

        this.events.itemClick(data, $element, event);
    }.bind(this));
    !//==================================================

        this.$list.append($tr);
};




Planck.Extension.EntityEditor.View.Component.EntityList.prototype.renderPagination = function (segmentDescriptor) {
    this.$pagination.html('');


    if (this.currentSegmentIndex > 0) {
        this.$pagination.append('<a class="" data-behaviour="interactive"><i class="fas fa-angle-left"></i></a>')
    }


    for (var pageIndex = 0; pageIndex < segmentDescriptor.count; pageIndex++) {
        var pageNumber = pageIndex + 1;

        if (pageIndex == segmentDescriptor.currentIndex) {
            this.$pagination.append('<span class="selected" data-behaviour="interactive">' + pageNumber + '</i></span>')

        }
        else {
            var $paginationItem = $('<a data-segment-index="' + pageIndex + '" data-behaviour="interactive">' + pageNumber + '</i></a>');

            $paginationItem.click(function (event) {
                var segmentIndex = $(event.target).attr('data-segment-index');
                this.load(segmentIndex);
            }.bind(this));

            this.$pagination.append($paginationItem)

        }

    }

    if (this.currentSegmentIndex < segmentDescriptor.count - 1) {
        this.$pagination.append('<a class="" data-behaviour="interactive"><i class="fas fa-angle-right"></i></a>')
    }


};

Planck.Extension.EntityEditor.View.Component.EntityList.prototype.searchAndHighlight = function(value, search)
{
    var regexp = new RegExp('('+search+')','gi');
    return value.replace(regexp, this.highlight('$1'));
};

Planck.Extension.EntityEditor.View.Component.EntityList.prototype.highlight = function(string)
{
    return '<span class="plk-highlighted">'+string+'</span>';
};



Planck.Extension.EntityEditor.View.Component.EntityList.prototype.clearList = function () {
    this.$list.find('tbody').html('');
};
;
Planck.Extension.EntityEditor.View.Component.EntityListToolbar = function(entityList)
{

    this.entityList = entityList;

    this.$element = $(
        '<div class="plk-entity-list-toolbar">'+
            '<div class="plk-entity-list-toolbar-title"></div>'+
        '</div>'
    );

    this.$titleElement = this.$element.find('.plk-entity-list-toolbar-title');

    this.searchBar = new Planck.Extension.EntityEditor.View.Component.EntitySearchBar(
        this.entityList.getEntityType()
    );

    this.searchBar.on('search', function(result) {
        this.events.search(result);
    }.bind(this));


    this.$element.append(this.searchBar.getElement());

    this.events = {
        search: function(result) {

        }
    };
};

Planck.Extension.EntityEditor.View.Component.EntityListToolbar.prototype.getSearch = function()
{
   return this.searchBar.getSearch();
};

Planck.Extension.EntityEditor.View.Component.EntityListToolbar.prototype.on = function(eventName, callback)
{
   this.events[eventName] = callback;
   return this;
};



Planck.Extension.EntityEditor.View.Component.EntityListToolbar.prototype.setTitle = function(title)
{
    this.$titleElement.html(title);
    return this;
};

Planck.Extension.EntityEditor.View.Component.EntityListToolbar.prototype.getElement = function()
{
   return this.$element;
};

;
Planck.Extension.EntityEditor.View.Component.EntitySearchBar = function(entityType)
{

    this.entityType = entityType;


    this.$element = $('<div class="plk-entity-search-bar plk-input-container plk-icon" data-behaviour="interactive" data-icon="&#xf002;"></div>');
    this.$input = $('<input class="plk-entity-search-bar-input" />');

    this.$element.append(this.$input);


    this.$input.keyup(function(event) {
        var search = this.getSearch();
        this.search(search);
    }.bind(this));

    this.services = {
        search: {
            url: '?/@extension/planck-extension-entity_editor/entity/api[search]'
        }
    };

    this.events = {
        search: function(result) {
        }
    };

};

Planck.Extension.EntityEditor.View.Component.EntitySearchBar.prototype.getSearch = function()
{
   return this.$input.val();
};
Planck.Extension.EntityEditor.View.Component.EntitySearchBar.prototype.on = function(eventName, callback)
{
    this.events[eventName] = callback;
    return this;
};



Planck.Extension.EntityEditor.View.Component.EntitySearchBar.prototype.search = function(search)
{
   var url = this.services.search.url;
   var data = {
       entityType: this.entityType,
       search: search,
       limit: 2
   };
   Planck.ajax({
       url: url,
       method: 'get',
       data: data,
       success: function(response) {
           this.events.search(response);
       }.bind(this)
   });


};



Planck.Extension.EntityEditor.View.Component.EntitySearchBar.prototype.getElement = function()
{
    return this.$element;
};
;
$(function() {

    if(document.location.toString().match(/\/@extension\/planck-extension-entity_editor\/entity\/main\[manage\]/)) {
        var controller = new Planck.Extension.EntityEditor.Module.Entity.Controller.EntityManager(
            $('.plk-entity-manager-container')
        );
        controller.initialize();
    }




    //Planck.Extension.EntityEditor.initialize();
});
;
Planck.Extension.FormComponent = {};
Planck.Extension.FormComponent.View = {};

Planck.Extension.FormComponent.View.Component = {};


//Planck.Extension.FormComponent.View.FormElement = {};

Planck.Extension.FormComponent.Module = {};
Planck.Extension.FormComponent.Model = {};
Planck.Extension.FormComponent.Model.Entity = {};
Planck.Extension.FormComponent.Model.Repository = {};




Planck.Extension.FormComponent.initialize = function(container)
{
    $(container).find('.plk-component.plk-tree-input').each(function(index, element) {
        var tree = new Planck.Extension.FormComponent.View.Component.TreeInput(element);
        tree.initialize();
    });



    $(container).find('.plk-component.plk-tag-input').each(function(index, element) {
        var tagInput = new Planck.Extension.FormComponent.View.Component.TagInput(element);
        tagInput.initialize();
    });


    $(container).find('.plk-component.plk-rich-text-input').each(function(index, element) {
        var richEdit = new Planck.Extension.FormComponent.View.Component.RichTextInput(element);
        richEdit.initialize();
    });

};

;

var Inline = Quill.import('blots/inline');
var Block = Quill.import('blots/block');
var BlockEmbed = Quill.import('blots/block/embed');
var Container = Quill.import('blots/container');
var TextBlot = Quill.import('blots/text');
var Break = Quill.import('blots/break');
var Cursor = Quill.import('blots/cursor');
var Parchment = Quill.import("parchment");
;
class BlotToolbar
{
    constructor(container) {

        this.container = container;

        this.blot = this.container.getBlot();


        this.$element = $('<div class="plk-blot-toolbar" style="display: flex" ></div>');
        this.$element.attr('contenteditable', false);

        this.$leftDivision = $('<div style="flex:1"></divstyle>');
        //this.$centerDivision = $('<div style="flex:1"></divstyle>');
        this.$rightDivision = $('<div style="flex:1"></divstyle>');

        this.divisions = {
            left:this.$leftDivision,
            //center: this.$centerDivision,
            right: this.$rightDivision
        };


        this.$element.append(this.$leftDivision);
        //this.$element.append(this.$centerDivision);
        this.$element.append(this.$rightDivision);




        /*
        this.$element.append('<i class="button button-edit far fa-square" style="vertical-align: middle"></i>');
        this.$element.append('<i class="button button-edit fas fa-grip-lines" style="vertical-align: middle"></i>');
        */


        var blockClass ='selected';
        if(this.blot.getValue('display') != 'block') {
            blockClass = '';
        }



        this.$insertPButton = $('<i class="fas fa-angle-double-down button"></i>');
        this.$insertPButton.on('click', function() {

               var $containerElement = this.container.getElement();
                $containerElement.before('<p></p>');


        }.bind(this));
        this.$leftDivision.append(this.$insertPButton);



        this.$displayButton = $('<i class="button button-block fas fa-cube '+blockClass+'"></i>');
        this.$leftDivision.append(this.$displayButton);
        this.$displayButton.on('click', this.setDisplay.bind(this));


        this.$resizeButton = $('<i class="button fas fa-ruler-combined"></i>');
        this.$leftDivision.append(this.$resizeButton);
        //this.$resizeButton.on('click', this.setDisplay.bind(this));





        this.$rightDivision.append('<i class="button button-edit fas fa-pen-square"></i>');
        this.$rightDivision.append('<i class="button button-delete fas fa-cog"></i>');
        this.$rightDivision.append('<i class="button button-delete fas fa-trash"></i>');
        this.$rightDivision.css('text-align', 'right');



        this.$element.find('.button-delete').on('click', this.deleteHandler.bind(this));
        this.$element.find('.button-edit').on('click', this.editHandler.bind(this));




    }

    setDisplay()
    {

        console.log(this.blot.getValue('display'));

        if(this.blot.getValue('display') == 'block') {
            this.blot.setValue('display', 'inline-block');
            this.container.getElement().css('display', 'inline-block');
            this.$displayButton.removeClass('selected');
        }
        else {
            this.blot.setValue('display', 'block');
            this.container.getElement().css('display', 'block');
            this.$displayButton.addClass('selected');
        }


    }



    getElement()
    {
        return this.$element;
    }





    deleteHandler(event)
    {
        this.blot.remove();
    }


    editHandler(event) {

        var event = new CustomEvent('plk-blot-edit', {
            bubbles: true,
            detail: {
                blot: this.blot
            }
        });

        var trigger = this.$element.get(0);
        trigger.dispatchEvent(event);


        var overlay = new Planck.Extension.ViewComponent.View.Component.Overlay();


        var blotEditor = new Planck.Extension.FormComponent.View.Component.RichTextInput.BlotEditor(this.blot);
        var form = blotEditor.getForm(function() {
            overlay.destroy();
        });

        overlay.render(document.body);
        overlay.show(form);
    }


    addInput(input, division)
    {
        if(!division) {
            division = 'left';
        }
        this.divisions[division].append(input)
        //this.$element.prepend(input);
    }


    initializeBorderInput()
    {

        this.$element.append(this.$borderSelect);
    }




}
;
class BlotContainer
{
    constructor(blot)
    {

        this.blot = blot;

        this.$element = this.blot.getElement();

        this.toolbar = new BlotToolbar(this);
        this.$element.prepend(this.toolbar.getElement());


        this.makeResizable();

        this.floatAttribute = new ContainerAttributeFloat(this);
        this.borderAttribute  = new ContainerAttributeBorder(this);

    }

    getElement()
    {
        return this.$element;
    }

    getToolbar()
    {
        return this.toolbar;
    }

    getBlot()
    {
        return this.blot;
    }


    makeResizable()
    {


        this.$element.resizable({
            //aspectRatio: true,
            stop: function() {

                var jsonAttributes = this.$element.attr('data-attributes');
                var attributes = JSON.parse(jsonAttributes);
                attributes.height = this.$element.get(0).offsetHeight+'px';
                attributes.width =  this.$element.get(0).offsetWidth+'px';
                this.$element.attr('data-attributes', JSON.stringify(attributes));


            }.bind(this)
        });
    }



}
;
class ContainerAttribute
{

    constructor(container)
    {
        this.container = container;
        this.$element = container.getElement();
        this.blot = container.getBlot();
        this.initialize();
    }

    initialize()
    {

    }

}
;

class RichBlot extends BlockEmbed
{

    static create(values)
    {
        var values = $.extend({
            align: 'left',
            style: '',
            height: 'auto',
            width: 'auto',
            float : 'none',
            display: 'block'
        }, values);


        var node = super.create();
        node.setAttribute('contenteditable', false);
        node.setAttribute('data-attributes', JSON.stringify(values));

        $(node).css({
            height: values.height,
            width: values.width,
            overflow: 'hidden',
            position: 'relative',
        });


        return node;
    }



    static getAttributesFromNode(node)
    {
        return JSON.parse(node.getAttribute('data-attributes'));
    }

    static value(node)
    {
        return RichBlot.getAttributesFromNode(node);
    }

    static formats(node)
    {
        return RichBlot.getAttributesFromNode(node);
    }


    constructor(domNode) {

        super(domNode);
        this.userAttributes = RichBlot.getAttributesFromNode(domNode);
        this.$domNode = $(this.domNode);
        this.$domNode.addClass('plk-blot-rich');

        this.container = new BlotContainer(this);
    }

    getElement()
    {
        return this.$domNode;
    }

    getValues()
    {
        return this.userAttributes;
    }

    setValue(name, value)
    {
        this.userAttributes[name] = value;
        this.updateNode();
        return this;
    }

    getValue(name)
    {
        return this.userAttributes[name];
    }


    getDescriptor()
    {
        return this.__proto__.statics.attributesDescriptors;
    }



    updateNode()
    {
        this.domNode.setAttribute(
            'data-attributes',
            JSON.stringify(this.userAttributes)
        );
    }

}

RichBlot.toolbarClassName = 'plk-blot-toolbar';
RichBlot.componentTagWrapper = 'div';
RichBlot.componentClassName = 'plk-blot-rich';

;
class ContainerAttributeBorder extends ContainerAttribute
{


    initialize()
    {
        super.initialize();

        var values = this.container.getBlot().getValues();



        return;


        this.container.getToolbar().addInput(
            this.getInput()
        );

        this.formatContainer(values.border);

    }

    formatContainer(borderName)
    {

        var border = 'none';

        if(borderName == 'none') {
            border= 'none';
        }
        else if(borderName == 'solid') {
            border = 'solid 3px #000';
        }

        else if(borderName == 'dashed') {
            border = 'solid 1px #000';
        }

        this.blot.getElement().css({
            'border': border
        });


    }

    changeBorder(event)
    {

        var borderName = event.target.value;

        this.formatContainer(borderName);

        var jsonAttributes = this.blot.getElement().attr('data-attributes');
        var attributes = JSON.parse(jsonAttributes);
        attributes.border = borderName;
        this.blot.getElement().attr('data-attributes', JSON.stringify(attributes));
    }


    getInput()
    {

        var values = this.blot.getValues();

        this.$input = $('<select class="block-format-border" style="vertical-align: middle"></select>');
        var options = {
            none: 'Pas de bordure',
            solid: 'Bordure pleine',
            dashed: 'Bordure pointillées'
        };


        var border = values.border;

        for(var value in options) {
            var selected ='';

            if(border == value) {
                selected = 'selected="selected"';
            }

            this.$input.append(
                '<option '+selected+' value="'+value+'">'+options[value]+'</option>'
            );
        }

        this.$input.change(this.changeBorder.bind(this));

        return this.$input;
    }


}


;
class ContainerAttributeFloat extends ContainerAttribute
{


    initialize()
    {
        super.initialize();


        var values = this.container.getBlot().getValues();

        this.formatContainer(values.float);



        this.container.getToolbar().addInput(
            this.getInputSelect()
        );
    }

    formatContainer(float)
    {
        this.$element.css({
            float: float
        });
    }




    getInputSelect()
    {

            var values = this.blot.getValues();

            this.$input = $('<select class="button block-format-align fas" style="vertical-align: middle"></select>');
            var options = {
                none: '&#xf039',
                left: '&#xf036',
                right: '&#xf038'
            };


            var float = values.float;

            for(var value in options) {
                var selected ='';

                if(float == value) {
                    selected = 'selected="selected"';
                }

                this.$input.append(
                    '<option '+selected+' value="'+value+'" class="fas fa-align-right">'+options[value]+'</option>'
                );
            }

            this.$input.change(this.changeFloat.bind(this));

            return this.$input;
    }


    changeFloat(event)
    {

        var float = event.target.value;

        this.formatContainer(float);

        var jsonAttributes = this.blot.getElement().attr('data-attributes');
        var attributes = JSON.parse(jsonAttributes);
        attributes.float = float;
        this.blot.getElement().attr('data-attributes', JSON.stringify(attributes));
    }





}


;
class CodeDisplay extends BlockEmbed
{
    static create(values)
    {

        var node = super.create(values);


        var code = '';
        if(values.code) {
            code = CodeEdition.escape(values.code)
        }

        $(node).append(
            '<pre class="line-numbers" style="position:relative">'+
            '<code class="language-'+values.language+' " data-attribute-name="code">'+
            code+
            '</code>'+
            '</pre>'
        );

        return node;
    }

    static escape(unsafe)
    {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


}

CodeDisplay.blotName = 'plk-blot-code-display';
CodeDisplay.tagName = 'div';
CodeDisplay.className = 'plk-blot-code-display';


CodeDisplay.attributesDescriptors = {
    content: {
        type: 'text'
    },
    language: {
        type: 'select',
        options: [
            {value: 'raw', label: 'Aucun'},
            {value: 'javascript', label: 'Javascript'},
            {value: 'php', label: 'PHP'}
        ]
    }

};

Quill.register(CodeDisplay);

;
class PlanckImageDisplay extends BlockEmbed
{
    static create(value)
    {

        var value = $.extend({
            description: '',
            align: 'left',
            style: '',
        }, value);


        var node = super.create(value);

        $(node).css({
            height: value.height,
            width: value.width,
            overflow: 'hidden',
            position: 'relative',
            float: value.float
        });


        $(node).append(
            '<div style="width: 100%; height: 100%; position: relative">'+
            '<img  src="'+value.src+'" style="width: 100%; height: 100%;'+value.style+'"/>'+
            '<div class="description" style="width:100%; background-color:rgba(255,255,255,0.8">'+value.description+'</div>'+
            '</div>'
        );


        return node;
    }

    updateNode()
    {
        super.updateNode();
        console.log(
            $(this.domNode).find('code')
        );
        console.log(this.userAttributes);
        $(this.domNode).find('code').html(this.userAttributes.content);
    }


}

PlanckImageDisplay.blotName = 'plk-blot-image-display';
PlanckImageDisplay.tagName = 'div';
PlanckImageDisplay.className = 'plk-blot-image-display';


PlanckImageDisplay.attributesDescriptors = {
    content: {
        type: 'text'
    },
    language: {
        type: 'select',
        options: [
            {value: 'raw', label: 'Aucun'},
            {value: 'javascript', label: 'Javascript'},
            {value: 'php', label: 'PHP'}
        ]
    }

};

Quill.register(PlanckImageDisplay);
;
class CodeEdition extends RichBlot
{
    static create(values)
    {

        var node = super.create(values);


        var code = '';
        if(values.code) {
            code = CodeEdition.escape(values.code)
        }

        $(node).append(
            '<pre class="line-numbers" style="position:relative">'+
                '<code class="language-'+values.language+' " data-attribute-name="code">'+
                    code+
                '</code>'+
            '</pre>'
        );

        return node;
    }

    static escape(unsafe)
    {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    constructor(domNode)
    {
        super(domNode);
        Prism.highlightElement($(this.domNode).find('code').get(0));
    }

    updateNode()
    {
        super.updateNode();

        this.$domNode.find('pre').html('');
        this.$domNode.find('pre').append(
            '<code class="language-'+this.userAttributes.language+' " data-attribute-name="code">'+
                CodeEdition.escape(this.userAttributes.code)+
            '</code>'
        );

        Prism.highlightElement($(this.domNode).find('code').get(0));
    }


}

CodeEdition.blotName = 'plk-blot-code-edition';
CodeEdition.tagName = 'div';
CodeEdition.className = 'plk-blot-code-edition';


CodeEdition.attributesDescriptors = {
    language: {
        type: 'select',
        label: "Langage",
        options: [
            {value: 'raw', label: 'Aucun'},
            {value: 'javascript', label: 'Javascript'},
            {value: 'php', label: 'PHP'}
        ]
    },
    code: {
        label: "Code",
        type: 'textarea'
    },
};

Quill.register(CodeEdition);
;
class PlanckImageEdition extends RichBlot
{
    static create(value)
    {

        var defaultValues = {
            description: '',
            align: 'left',
            style: '',
        };

        var values = defaultValues;
        for(var key in value) {
            var attributeValue = value[key];
            if(attributeValue) {
                values[key] = attributeValue;
            }
        }

        var node = super.create(values);


        $(node).append(
            '<div style="width: 100%; height: 100%; position: relative;">'+
                '<img  src="'+value.src+'" style="width: 100%; height: 100%;'+values.style+'"/>'+
                '<div class="description" style="position: absolute; bottom:0; width: 100%;background-color:rgba(255,255,255,0.8">'+values.description+'</div>'+
            '</div>'

        );
        return node;
    }

    updateNode()
    {
        super.updateNode();

        var $description = $(this.domNode).find('.description');
        $description.html(this.userAttributes.description);

    }


}

PlanckImageEdition.blotName = 'plk-blot-image-edition';
PlanckImageEdition.tagName = 'div';
PlanckImageEdition.className = 'plk-blot-image-edition';


PlanckImageEdition.attributesDescriptors = {
    src: {
        type: 'text',
        label: function() {
            return 'URL : '
        },
        description: ''
    },
    description: {
        type: 'textarea',
        label: 'Description : '
    },
    align: {
        type: 'select',
        label: 'Alignement',
        options: [
            {value: 'left', label: 'Gauche'},
            {value: 'right', label: 'Droite'},
            {value: 'middle', label: 'Milieu'},
            {value: 'top', label: 'Haut'},
            {value: 'bottom', label: 'Bas'}
        ]
    },


};

Quill.register(PlanckImageEdition);
;
class PreBlot extends RichBlot
{
    static create(value)
    {

        let node = super.create();

        node.innerHTML= this.wrap(
            '<pre>test</pre>'
        );

        return node;
    }
}

PreBlot.blotName = 'pre';
PreBlot.tagName = 'div';
PreBlot.className = 'plk-component-pre';

Quill.register(PreBlot);
;
RichEditFeatureClearFloat = function(editor)
{
    this.editor = editor;

    this.$toolbarButton = $('<button class="fas fa-angle-double-left ql-clear" value="both"></button>');


    var clear = new Parchment.Attributor.Class ('clear', 'plk-blot-style-clear');
    Parchment.register(clear);

    /*
    this.$toolbarButton.click(function() {
        this.clearFloat();
    }.bind(this));
    */

    this.editor.getToolBar().addButton(this.$toolbarButton);
};


RichEditFeatureClearFloat.prototype.clearFloat = function()
{







};

;
RichEditFeatureCode = function(editor)
{
    this.editor = editor;

    this.$toolbarButton = $('<button class="far fa-file-code"></button>');

    this.$toolbarButton.click(function() {
        this.openDialog();
    }.bind(this));

    this.editor.getToolBar().addButton(this.$toolbarButton);
};


RichEditFeatureCode.prototype.openDialog = function()
{
    var node = CodeEdition.create({});
    var codeBlot = new CodeEdition(node);
    var editor = new Planck.Extension.FormComponent.View.Component.RichTextInput.BlotEditor(codeBlot);

    var overlay = new Planck.Extension.ViewComponent.View.Component.Overlay();
    overlay.show(
        editor.getForm(function(editor) {

            var values = editor.getBlot().getValues();

            var blot = this.editor.insertEmbedBlot('plk-blot-code-edition', {
                code: values.code,
                language: values.language
            });

            overlay.destroy();
            return blot;



        }.bind(this))
    );

};

;
RichEditFeatureImage = function(editor)
{
    this.editor = editor;

    this.$toolbarButton = $('<button class="far fa-image"></button>');

    this.$toolbarButton.click(function() {
        this.openList();
    }.bind(this));



    this.editor.getToolBar().addButton(this.$toolbarButton);

    this.editor.getDropZone().on('upload', function(datalayer) {

        $(datalayer).each(function(index, dataLayerRecord) {
            var descriptor = {
                image: dataLayerRecord
            };

            var dataLayer = new Planck.DataLayer();
            dataLayer.load(descriptor);
            var imageInstance = dataLayer.get('image');

            this.insert(imageInstance, descriptor);

        }.bind(this));
    }.bind(this));

};


RichEditFeatureImage.prototype.insert = function(imageEntity, dataLayer)
{
    var blot = this.editor.insertEmbedBlot('plk-blot-image-edition', {
        src: imageEntity.getValue('url'),
        description: imageEntity.getValue('title'),
        dataLayer: dataLayer
    });
    return blot;
};





RichEditFeatureImage.prototype.openList = function () {


    var overlay = new Planck.Extension.ViewComponent.View.Component.Overlay();
    overlay.render(document.body);


    var imageList = new Planck.Extension.Content.Module.Image.View.Component.Gallery();


    imageList.on('thumbnailClick', function (thumbnail) {
        var imageInstance = thumbnail.getDataLayer().get('image');
        this.insert(imageInstance, thumbnail.getDataLayer());
        overlay.destroy();

    }.bind(this));


    var remoteCall = imageList.getRemoteCallInstance();


    remoteCall.addMethodCall('loadAllImages', {
        parameters: null
    });


    remoteCall.load(function (descriptor) {

        var dom = $(descriptor.getHTML());
        imageList.setElement(dom);

        overlay.show(
            imageList.getElement()
        );
    }.bind(this));
};

;
RichEditFeatureParagraphStyle = function(editor)
{
    this.editor = editor;

    this.$selectBox = $(
        '<select>'+
        '<option value="">Style par défaut</option>'+
            '<option value="important">Important</option>'+
        '</select>'
    );


    var paragraphStyler = new Parchment.Attributor.Class ('paragraphStyler', 'plk-paragraph');
    Parchment.register(paragraphStyler);


    $(this.editor.editor.root).click(function() {

        this.$selectBox.find('option').prop('selected', false);

        var formats = this.editor.editor.getFormat();
        for(var formatName in formats) {

            if(formatName == 'paragraphStyler') {
                var format = formats[formatName];
                this.$selectBox.find('option[value='+format+']').prop('selected', true);

                return;
            }
        }
        console.log(formats);

    }.bind(this));


    this.$selectBox.change(function(event) {

        var styleName = $(event.target).val();
        if(styleName) {
            this.editor.editor.format('paragraphStyler', styleName);
        }
        else {
            this.editor.editor.format('paragraphStyler', false);
        }
    }.bind(this));




    var clear = new Parchment.Attributor.Class ('class', 'plk-paragraph');
    Parchment.register(clear);

    /*
     this.$toolbarButton.click(function() {
     this.clearFloat();
     }.bind(this));
     */

    this.editor.getToolBar().addButton(this.$selectBox);
};





RichEditFeatureClearFloat.prototype.clearFloat = function()
{







};

;
Planck.Extension.FormComponent.View.Component.EntitySelector = function (container, options)
{

    this.$container = $(container);

    this.$element = $('<div></div>');




    this.$entitySelector = $('<select></select>');
        var $fieldset = $('<fieldset><label>Type d\'object</label></fieldset>');
        $fieldset.find('label').append(this.$entitySelector);
        this.$element.append($fieldset);

    this.$methodSelector = $('<select></select>');
        var $fieldset = $('<fieldset><label>Méthode de chargement</label></fieldset>');
        $fieldset.find('label').append(this.$methodSelector);
        this.$element.append($fieldset);

    this.$attributeSelector = $('<select></select>');
    this.$attributeValue = $('<input/>');

        var $fieldset = $('<fieldset><label>Attribut</label></fieldset>');
        $fieldset.find('label').append(this.$attributeSelector);

        $fieldset.append('<label>Valeur</label>').append(this.$attributeValue);

        this.$element.append($fieldset);

};

Planck.Extension.FormComponent.View.Component.EntitySelector.prototype.loadSelectableEntities = function()
{
    var url = '';
    var data = {
    };
    Planck.ajax({
        url: url,
        method: 'get',
        data: data,
        success: function(response) {

        }.bind(this)
    });


};


Planck.Extension.FormComponent.View.Component.EntitySelector.prototype.render = function()
{
    this.$container.append(this.$element);
};
;
Planck.Extension.FormComponent.View.Component.RichTextInput = function (container, options) {

    this.options = {
        height: '500px'
    };

    this.options = $(options).extend(this.options);


    this.editor = null;

    this.dropZone = null;


    this.features = {};
    //this.imageFeature = null;
    //this.codeFeature = null;

    this.$container = $(container);
    this.$container.data('manager', this);



    this.$placeholder = this.$container.find('.plk-rich-text-placeholder');

    this.$previewPlaceholder = $('.editor-preview');


    this.$valueElement = this.$container.find('.plk-rich-text-value-container');
    this.$valueElement.addClass('form-data');
    this.$valueElement.attr('name', this.$container.attr('data-name'));

    this.$htmlValueElement = this.$container.find('.plk-rich-text-html-value-container');


    //this.$htmlValueElement.addClass('form-data');
    //this.$htmlValueElement.attr('name', this.$container.attr('data-name'));




    this.toolbar = new Planck.Extension.FormComponent.View.Component.RichTextInput.Toolbar(this);

};


Planck.Extension.FormComponent.View.Component.RichTextInput.Feature = {};






Planck.Extension.FormComponent.View.Component.RichTextInput.prototype.initialize = function () {
    this.$container.append(this.$valueElement);
    this.initializeEditor();
};


Planck.Extension.FormComponent.View.Component.RichTextInput.prototype.setHeight = function(height)
{
    $(this.editor.root).css('height', height);
    return this;
};






Planck.Extension.FormComponent.View.Component.RichTextInput.prototype.initializeEditor = function()
{


    this.$container.prepend(this.toolbar.getElement());


    this.initializeDropZone();



    this.previewRenderer = new Planck.Extension.FormComponent.View.Component.RichTextInput.PreviewRenderer(
        this.$previewPlaceholder.get(0),
        this
    );

    this.features['clearFloatFeature'] = new RichEditFeatureClearFloat(this);



    this.editor = new Quill(this.$placeholder.get(0), {
        theme: 'snow',
        modules: {
            toolbar: this.toolbar.getOptions()
        }
    });


    this.initializeFeatures();




    //$(this.editor.root).css('height', '100%');
    $(this.editor.root).resizable();
    this.setHeight(this.options.height);

    //$(this.editor.root).css('height', this.options.height);

    this.$placeholder.resizable({
        handles: "s",
        containment: $('#phi-main-container'),
        stop: function() {
            $(this.editor.root).css('height', '100%');
        }.bind(this)
    });


    this.editor.on('text-change', function (delta, oldDelta, source) {
        this.renderPreview(delta, oldDelta, source);


        this.$valueElement.val(
            JSON.stringify(
                this.editor.getContents()
            )
        );


        this.$htmlValueElement.val(
            this.previewRenderer.getHTML()
        );


    }.bind(this));




    if(this.$valueElement.val()) {
        try {
            let contents = JSON.parse(this.$valueElement.val());
            this.editor.setContents(contents);
        }
        catch(exception) {
            this.$valueElement.val('');
        }

    }


    this.renderPreview();

};


Planck.Extension.FormComponent.View.Component.RichTextInput.prototype.initializeFeatures = function()
{

    this.features['paragraphStyleFeature'] = new RichEditFeatureParagraphStyle(this);

    this.features['codeFeature'] = new RichEditFeatureCode(this);
    this.features['imageFeature'] = new RichEditFeatureImage(this);

    //

    return this;
};




Planck.Extension.FormComponent.View.Component.RichTextInput.prototype.initializeDropZone = function()
{


    this.dropZone = new Planck.Component.DropZone(this.$container);

    this.dropZone.on('drop', function(event) {
        let evt = event.originalEvent;

        if (document.caretRangeFromPoint) {
            let selection = document.getSelection();
            let range = document.caretRangeFromPoint(evt.clientX, evt.clientY);
            if (selection && range) {
                selection.setBaseAndExtent(range.startContainer, range.startOffset, range.startContainer, range.startOffset);
            }
        }
        event.preventDefault();
        event.stopPropagation();
    }.bind(this));

};


Planck.Extension.FormComponent.View.Component.RichTextInput.prototype.getDropZone = function()
{
   return this.dropZone;
};

Planck.Extension.FormComponent.View.Component.RichTextInput.prototype.getToolBar = function()
{
    return this.toolbar;
};





Planck.Extension.FormComponent.View.Component.RichTextInput.prototype.renderPreview = function(delta, oldDelta, source)
{

    var editorDelta = this.editor.getContents();
    var previewDelta = this.previewRenderer.convertEditorBlot(editorDelta);
    this.previewRenderer.setContents(previewDelta);
};


Planck.Extension.FormComponent.View.Component.RichTextInput.prototype.insertContent = function (blotName, value) {
    var range = this.editor.getSelection(true);
    this.editor.setSelection(range.index + 1, Quill.sources.SILENT);
    return this;

};



Planck.Extension.FormComponent.View.Component.RichTextInput.prototype.insertEmbedBlot = function(blotName, data)
{
    var editorRange = this.editor.getSelection(true);
    this.editor.insertText(editorRange.index, "\n");
    var delta = this.editor.insertEmbed(editorRange.index+1, blotName, data);
    this.editor.insertText(editorRange.index+2, "\n");
    this.editor.setSelection(editorRange.index + 3, Quill.sources.SILENT);

    return delta;
};




Planck.Extension.FormComponent.View.Component.RichTextInput.prototype.getHTML = function () {
    return this.$container.find('.ql-editor').html();
};











;
Planck.Extension.FormComponent.View.Component.TagInput = function(container)
{
    this.$container = $(container);

    this.$container.data('manager', this);


    this.dataSource = this.$container.attr('data-source');

    this.$placeholder = this.$container.find('.plk-tag-placeholder');
    this.$valuesContainer = this.$container.find('.plk-tag-values-placeholder');

    this.name = this.$container.attr('data-name');


    this.events = {
       change: function(instance) {

       }
    };


};




Planck.Extension.FormComponent.View.Component.TagInput.prototype.initialize = function()
{



    var tagInput = this.$placeholder.magicSuggest({
        data: this.dataSource,
        value: this.getValues(),
        ajaxConfig: {
            xhrFields: {
                withCredentials: true,
            }
        }
    });

    var self = this;

    $(tagInput).on('focus', function(e,m) {
        this.expand();
    });

    $(tagInput).on('blur', function(e,m) {
        this.collapse();
    });


    $(tagInput).on('selectionchange', function(e,m){

        self.$valuesContainer.html('');
        var values = this.getValue();

        for(var i=0; i<values.length; i++) {
            var value = values[i];
            self.createInputValue(value)
        }

        self.events.change(self);

    });
};

Planck.Extension.FormComponent.View.Component.TagInput.prototype.on = function(eventName, callback)
{
   this.events[eventName] = callback;
   return this;
};


Planck.Extension.FormComponent.View.Component.TagInput.prototype.getValues = function()
{
   var values = [];
    this.$valuesContainer.find('.plk-tag-input-value').each(function(index, input) {
        values.push(
           $(input).val()
        );
    });
    return values;
};


Planck.Extension.FormComponent.View.Component.TagInput.prototype.createInputValue = function(value)
{
   var input = $('<input />');
    input.val(value);
    input.attr('name', this.name);
    input.addClass('plk-tag-input-value');
    input.addClass('form-data');
    input.attr('type', 'hidden');
    this.$valuesContainer.append(input);
    return this;
};
;
Planck.Extension.FormComponent.View.Component.TreeInput = function(container)
{
    this.$container = $(container);
    this.dataSource = this.$container.attr('data-source');

    this.$input = this.$container.find('input');

    this.$treeContainer = this.$container.find('.plk-tree-placeholder');

    this.tree;
};

Planck.Extension.FormComponent.View.Component.TreeInput.prototype.initialize = function()
{
    var options = {
        sourceURL: this.dataSource,
        editable: false
    };

    this.tree = new Planck.Extension.ViewComponent.View.Component.EntityTree(options)
    this.tree.on('select', function(data) {
        var node = data.node;


        this.$input.val(node.id);

    }.bind(this));

};










;
Planck.Extension.FormComponent.View.Component.RichTextInput.BlotEditor = function(blot)
{
    this.blot = blot;
};







Planck.Extension.FormComponent.View.Component.RichTextInput.BlotEditor.prototype.getForm = function(callback)
{

    var blot = this.blot;

    var blotDescriptor = blot.getDescriptor();


    this.$element = $('<div></div>');
    this.$element .css({
        border: 'solid 1px #F00'
    });


    this.$element .html('');
    for(var name in blotDescriptor) {


        var value ='';
        if(isset(blot.userAttributes[name])) {
            value = blot.userAttributes[name];
        }

        var fieldDescriptor = blotDescriptor[name];
        if(fieldDescriptor.type == 'text') {
            var input = this.renderBlotInput(fieldDescriptor, name, value);
        }
        else if(fieldDescriptor.type == 'textarea') {
            var input = this.renderBlotTextarea(fieldDescriptor, name, value);
        }
        else if(fieldDescriptor.type == 'select') {

            var input = this.renderBlotSelect(fieldDescriptor, name, value);
        }

        var wrapper = this.wrapBlotInput(input);
        this.$element .append(wrapper);
    }

    var $button = $('<button>enregistrer</button>');
    $button.on('click', function(event) {
        this.updateBlot(callback);
    }.bind(this));
    this.$element .append($button);


    return this.$element ;

};

Planck.Extension.FormComponent.View.Component.RichTextInput.BlotEditor.prototype.getBlot = function()
{
   return this.blot;
};

Planck.Extension.FormComponent.View.Component.RichTextInput.BlotEditor.prototype.updateBlot = function(callback)
{
    this.$element.find('.blot-attribute-value').each(function(index, element) {
        var attributeName = $(element).attr('name');
        var value = $(element).val();
        this.blot.userAttributes[attributeName] = value;
    }.bind(this));
    this.blot.updateNode();
    if(callback) {
        callback(this);
    }
};





Planck.Extension.FormComponent.View.Component.RichTextInput.BlotEditor.prototype.renderBlotLabel = function(descriptor)
{
    if(Planck.isFunction(descriptor.label)) {
        var label = descriptor.label(descriptor);
        var $label = $('<label>'+label+'</label>');
    }
    else {
        var $label = $('<label>'+descriptor.label+'</label>');
    }
    return $label;
};

Planck.Extension.FormComponent.View.Component.RichTextInput.BlotEditor.prototype.renderBlotInput = function(descriptor, name, value)
{

    var $label = this.renderBlotLabel(descriptor);


    var $input = $('<input class="blot-attribute-value" value="'+value+'" name="'+name+'"/>');

    $label.append($input);

    return $label;
};



Planck.Extension.FormComponent.View.Component.RichTextInput.BlotEditor.prototype.renderBlotTextarea = function(descriptor, name, value)
{
    var $label = this.renderBlotLabel(descriptor);

    var $input = $('<textarea class="blot-attribute-value"name="'+name+'">'+value+'</textarea>');

    $label.append($input);

    return $label;
};





Planck.Extension.FormComponent.View.Component.RichTextInput.BlotEditor.prototype.renderBlotSelect = function(descriptor, name, value)
{
    var $label = this.renderBlotLabel(descriptor);
    var $input = $('<select class="blot-attribute-value" name="'+name+'"></select>');
    for(var i=0; i<descriptor.options.length; i++) {
        var option = descriptor.options[i];
        var selected = '';
        if(value == option.value) {
            selected = 'selected '
        }

        $input.append(
            '<option value="'+option.value+'" '+selected+'>'+option.label+'</option>'
        );
    }

    $label.append($input);

    return $label;
};

Planck.Extension.FormComponent.View.Component.RichTextInput.BlotEditor.prototype.wrapBlotInput = function(element)
{

    var wrapper = $('<div class="plk-blot-attribute"></div>');
    wrapper.append(element);
    return wrapper;
};






























;
Planck.Extension.FormComponent.View.Component.RichTextInput.PreviewRenderer = function(container, richTexInput)
{
    this.richTexInput = richTexInput;

    this.$container = $(container);


    this.editor = new Quill(this.$container.get(0), {
        theme: 'snow',
        modules: {
            toolbar: false
        }
    });

    this.editor.disable(true);

};

Planck.Extension.FormComponent.View.Component.RichTextInput.PreviewRenderer.prototype.getHTML = function()
{
    return this.editor.root.innerHTML;
};

Planck.Extension.FormComponent.View.Component.RichTextInput.PreviewRenderer.prototype.initialize = function()
{
};


Planck.Extension.FormComponent.View.Component.RichTextInput.PreviewRenderer.prototype.convertEditorBlot = function(editorDelta)
{
    var previewDelta = {
        ops: []
    };

    for (var i = 0; i < editorDelta.ops.length; i++) {

        var blot = editorDelta.ops[i];


        for (var key in blot) {
            if (key == 'insert') {

                var conversions = [
                   ['plk-blot-image-edition', 'plk-blot-image-display'],
                    ['plk-blot-code-edition', 'plk-blot-code-display'],
                ];

                var newBlot = false;

                for(var conversionIndex=0; conversionIndex<conversions.length; conversionIndex++) {
                    var blotFrom = conversions[conversionIndex][0];
                    var blotTo = conversions[conversionIndex][1];
                    newBlot = this.convertBlot(blot, blotFrom, blotTo);
                    if(newBlot) {
                        break;
                    }
                }


                if(newBlot) {
                    previewDelta.ops[i] = newBlot;
                }
                else {
                    previewDelta.ops[i] = blot;
                }            }
            else {
                previewDelta.ops[i] = blot;
            }
        }
    }

    return previewDelta;
};



Planck.Extension.FormComponent.View.Component.RichTextInput.PreviewRenderer.prototype.convertBlot = function(blot, blotFromName, blotToName)
{
    if (isset(blot.insert[blotFromName])) {

        var attributes = blot.insert[blotFromName];

        var insertDescriptor = {};
        insertDescriptor[blotToName] = attributes;



        var newBlot = {
            insert: insertDescriptor,
        };
        return newBlot
    }
    return false;
};











Planck.Extension.FormComponent.View.Component.RichTextInput.PreviewRenderer.prototype.setContents = function(delta)
{
    return this.editor.setContents(delta);
};





;
Planck.Extension.FormComponent.View.Component.RichTextInput.Toolbar = function(richTexInput)
{

    this.richTexInput = richTexInput;

    this.$element = $(
        '<div style="position: relative; height:  60px">'+
            '<div style="position: absolute; z-index:100" class="button-container">' +
                '<select class="ql-header">' +
                    '<option selected=""></option>' +
                    '<option value="1">Titre 1</option>' +
                    '<option value="2">Titre 2</option>' +
                    '<option value="3">Titre 3</option>' +
                    '<option value="4">Titre 4</option>' +
                '</select>' +








                '<button class="ql-align" value=""></button>' +
                '<button class="ql-align" value="right"></button>' +
                '<button class="ql-align" value="justify"></button>' +


                '<button class="ql-bold"></button>' +
                '<button class="ql-italic"></button>' +

                '<button class="ql-link"></button>' +


            '</div>'+
        '</div>'
    );
    this.$buttonContainer = this.$element.find('.button-container');


    this.initialize();

};

Planck.Extension.FormComponent.View.Component.RichTextInput.Toolbar.prototype.addButton = function(button)
{
   this.$buttonContainer.append(button);
   return this;
};


Planck.Extension.FormComponent.View.Component.RichTextInput.Toolbar.prototype.initialize = function()
{


    $('.plk-component-blot-editor .blot-insert-trigger').click(function () {

        var blotName = $('input[name=blot-name]').val();
        var json = $('textarea[name="blot-attributes"]').val();

        var data = JSON.parse(
            json
        );


        this.insertEmbedBlot(blotName, data);

    }.bind(this));



    var clear = new Parchment.Attributor.Class ('clear', 'plk-blot-style-clear');
    Parchment.register(clear);


    this.$element.find('.plk-blot-code-trigger').click(function () {

        var data = {
            content: 'hello world' +"\n"+ Math.random(),
            language: 'php'
        };

        this.richTexInput.insertEmbedBlot('plk-blot-code-edition', data);

        return false;

    }.bind(this));

};

Planck.Extension.FormComponent.View.Component.RichTextInput.Toolbar.prototype.getOptions = function()
{


    var toolbarOptions = {
        container: this.$element.get(0),
        handlers: {
            // handlers object will be merged with default handlers object
            /*
            'image': function (value) {
                this.richTexInput.openImageList();
                return;
            }.bind(this)
            */
        },
    };

    return toolbarOptions;
};

Planck.Extension.FormComponent.View.Component.RichTextInput.Toolbar.prototype.getElement = function()
{
    return this.$element;
};




















;
Planck.Extension.Navigation = {};
Planck.Extension.Navigation.View = {};

Planck.Extension.Navigation.View.Component = {};

Planck.Extension.Navigation.Module = {};
Planck.Extension.Navigation.Model = {};
Planck.Extension.Navigation.Model.Entity = {};
Planck.Extension.Navigation.Model.Repository = {};



;
Planck.Extension.Navigation.RouteDescriptor = function()
{
    this.label = '';
    this.description = '';

};


Planck.Extension.Navigation.RouteDescriptor.prototype.loadFromDescriptor = function(descriptor)
{
   this.label = descriptor.label;
   this.description = descriptor.description;

   return this;
};


Planck.Extension.Navigation.RouteDescriptor.prototype.getLabel = function()
{
    return this.label;
};




;
Planck.Extension.Navigation.Model.Entity.Container = function()
{


};


Planck.inherit(
    Planck.Extension.Navigation.Model.Entity.Container,
    Planck.Model.Entity
);

;
Planck.Extension.Navigation.Model.Repository.Container = function()
{


};
;

Planck.Extension.Navigation.Module.Container = {
    View: {
        Component: {}
    },
    Controller: {}
};

;
Planck.Extension.Navigation.Module.Container.Controller.ContainerEditor = function()
{

    this.$element = $('div[data-component-name=Planck\\.Extension\\.Navigation\\.Module\\.Container\\.View\\.ContainerEditor]');



    this.$jsonEditorContainer = this.$element.find('.json-editor-container');

    this.$jsonEditorContainer.css('height', 800);

    this.containerEntity = null;
    this.containerDescriptor = null;

    this.jsonEditor = null;



    this.$jsonSaveButton = $('<button type="button">Enregistrer</button>');
    this.$element.prepend(this.$jsonSaveButton);
    this.$jsonSaveButton.click(function() {
        this.saveJSON();
    }.bind(this));


    this.initialize();
};


Planck.Extension.Navigation.Module.Container.Controller.ContainerEditor.prototype.saveJSON = function()
{

    console.log(this.containerEntity);




    var json = JSON.stringify(this.jsonEditor.get());

    console.log(this.containerEntity);

    this.containerEntity.setValue('descriptor', json);
    this.containerEntity.store();

    /*
    var url = '?/@extension/planck-extension-navigation/container/api[save]';
    var data = {
        json: json
    };
    Planck.ajax({
        url: url,
        method: 'post',
        data: data,
        success: function(response) {

        }.bind(this)
    });
    */



    console.log();
};




Planck.Extension.Navigation.Module.Container.Controller.ContainerEditor.prototype.initialize = function()
{
    Planck.Controller.prototype.initialize.call(this);
    this.containerEntity = this.getDataLayer().getEntry('navigationContainer');

    console.log(this.containerEntity);

    this.containerDescriptor = JSON.parse(
        this.containerEntity.getValue('descriptor')
    );

    console.log(this.containerEntity);
    this.initializeJsonEditor();

};




Planck.Extension.Navigation.Module.Container.Controller.ContainerEditor.prototype.initializeJsonEditor = function()
{
    var container = this.$jsonEditorContainer.get(0);
    var options = {
        mode: 'tree',
        modes: ['code', 'form', 'text', 'tree', 'view'], // allowed modes
        /*
        autocomplete: {
            getOptions: function () {
                return ['apple', 'cranberry', 'raspberry', 'pie', 'mango', 'mandarine', 'melon', 'appleton'];
            }
        }
        */
    };
    this.jsonEditor = new JSONEditor(container, options, this.containerDescriptor);


};





Planck.inherit(
    Planck.Extension.Navigation.Module.Container.Controller.ContainerEditor,
    Planck.Controller
);

;
Planck.Extension.Navigation.View.Component.RouteSelector = function()
{

    this.routes = {};


};



Planck.Extension.Navigation.View.Component.RouteSelector.prototype.loadRoutes = function()
{
    var url = '?/@extension/planck-extension-tool/route/api[get-routes]';

    var data = {
    };
    Planck.ajax({
        url: url,
        method: 'get',
        data: data,
        success: function(response) {


            for(var routeName in response) {
                if(response[routeName]) {
                    var descriptor = new Planck.Extension.Navigation.RouteDescriptor();
                    descriptor.loadFromDescriptor(
                        response[routeName]
                    );
                    this.routes[routeName] = descriptor;
                }
            }

            this.render('.plk-route-selector');


        }.bind(this)
    });


};

Planck.Extension.Navigation.View.Component.RouteSelector.prototype.render = function(container)
{
   this.$container = $(container);

    this.$container.html(this.getElement());

};


Planck.Extension.Navigation.View.Component.RouteSelector.prototype.getElement = function()
{
    this.$element = $('<select></select>');
    for(var routeName in this.routes) {
        var descriptor = this.routes[routeName];
        var $option = $('<option value="'+routeName+'">'+descriptor.getLabel()+'</option>');
        this.$element.append($option);
    }

    return this.$element;
};








;
$(function() {
    if(document.location.toString().match(/navigation\/container\/list/)) {

        var controller = new Planck.Extension.Navigation.Module.Container.Controller.ContainerEditor();


        var routeSelector = new Planck.Extension.Navigation.View.Component.RouteSelector();
        routeSelector.loadRoutes();


        var entitySelector = new Planck.Extension.FormComponent.View.Component.EntitySelector('.entity-selector-placeholder');
        entitySelector.render();



    }
});
;

Planck.Extension.StatusManager = {};

Planck.Extension.StatusManager.View = {};
Planck.Extension.StatusManager.View.Component = {};

Planck.Extension.StatusManager.View.Component.EntitySelector = {};

Planck.Extension.StatusManager.Module = {};
Planck.Extension.StatusManager.Model = {};
Planck.Extension.StatusManager.Model.Entity = {};
Planck.Extension.StatusManager.Model.Repository = {};




;

Planck.Extension.StatusManager.Module.Status = {
    Controller: {}
};

;
Planck.Extension.StatusManager.Module.Status.Controller.Manage = function(container)
{
    this.$container = $(container);
    this.$statusList = this.$container.find('.plk-status-list');

    this.$statusListHeader = this.$container.find('.plk-status-list-header');

    this.$statusListHeader.addClass('plk-header');

    this.repositoryName = this.$statusList.attr('data-repository');


    this.status = [];


};


Planck.Extension.StatusManager.Module.Status.Controller.Manage.prototype.initializeHeader = function()
{
    var container = $('<div class="plk-input-with-button-container" data-behaviour="interactive"></div>');
        this.$newStatusInput = $('<input placeholder="'+i18n('Nouveau status')+'"/>');
        this.$newStatusButton = $('<button type="button"><i class="fas fa-check"></i></button>');
    container.append(this.$newStatusInput);
    container.append(this.$newStatusButton);
    this.$statusListHeader.append(container);

    this.$newStatusInput.keyup(function(event) {
        if(event.key === 'Enter') {
            this.createStatus(this.$newStatusInput.val());
        }
    }.bind(this));
};


Planck.Extension.StatusManager.Module.Status.Controller.Manage.prototype.loadStatus = function()
{

    this.status = [];
    this.$statusList.html('');


    var statusInstance = new Planck.Extension.Content.Model.Entity.Status();
    var repository = statusInstance.getRepository();

    repository.getAllEntities({
        parameters: {
           sortBy: 'rank'
        },
        load: function(statusList) {
            $(statusList).each(function(index, status) {
                this.addStatus(status);
            }.bind(this));
        }.bind(this)
    });

};

Planck.Extension.StatusManager.Module.Status.Controller.Manage.prototype.addStatus = function(statusEntity)
{
    var statusComponent = new Planck.Extension.StatusManager.View.Component.Status()
    statusComponent.setModel(statusEntity);
    this.status.push(statusComponent);


    this.$statusList.append(statusComponent.getElement());


    statusComponent.getElement().click(function(event) {
        if(!$(event.target).data('manager')) {
            var statusComponent = $(event.target).parents('li').data('manager');
        }
        else {
            var statusComponent = $(event.target).data('manager');
        }

        console.log(statusComponent);
        this.loadEntityEditor(statusComponent.getModel());

    }.bind(this));
};


Planck.Extension.StatusManager.Module.Status.Controller.Manage.prototype.loadEntityEditor = function(statusEntity)
{
    var entityEditor = new Planck.Extension.EntityEditor.View.Component.EntityEditor(this.$container.find('.plk-editor-container'));
    entityEditor.setEntity(statusEntity);
    entityEditor.load();

};





Planck.Extension.StatusManager.Module.Status.Controller.Manage.prototype.createStatus = function(statusName)
{

    var statusInstance = new Planck.Extension.Content.Model.Entity.Status();
    statusInstance.setValue('name', statusName);
    statusInstance.store(function() {
        this.$newStatusInput.val('');
        this.loadStatus();
    }.bind(this));


};




Planck.Extension.StatusManager.Module.Status.Controller.Manage.prototype.initialize = function()
{
    this.initializeHeader();

    //this.$statusListHeader.html(this.repositoryName);

    this.$statusList.sortable({
        handle: '.plk-handler',
        stop: function(event, ui) {
            this.saveStatusOrder();
        }.bind(this)
    });
    this.$statusList.disableSelection();

    this.loadStatus();

};

Planck.Extension.StatusManager.Module.Status.Controller.Manage.prototype.saveStatusOrder = function()
{
    this.$statusList.find('.plk-status').each(function(index, element) {
        var statusComponent = $(element).data('manager');
        var statusEntity = statusComponent.getModel();

        console.log(statusEntity.getLabel()+' : '+index+' : '+statusEntity.getValue('rank'));

        if(statusEntity.getValue('rank') !== index) {
            statusEntity.setValue('rank', index);
            statusEntity.store();
        }
    });
};






;
Planck.Extension.StatusManager.View.Component.Status = function()
{
    this.model = null;
};

Planck.Extension.StatusManager.View.Component.Status.prototype.setModel = function(status)
{
    this.model = status;
};

Planck.Extension.StatusManager.View.Component.Status.prototype.getElement = function()
{
    if(!this.$element) {
        this.$element = $(
            '<li class="plk-status" data-behaviour="interactive" data-status-id="'+this.model.getId()+'">'+
            '<span class="plk-handler"></span>'+
            '<span class="label">'+this.model.getLabel()+'</span>'+
            '</li>'
        );
        this.$element.data('manager', this);
    }



    return this.$element
};

Planck.Extension.StatusManager.View.Component.Status.prototype.getModel = function()
{
    return this.model;
};




;
$(function() {

    if($('.plk-status-manager').length) {
        var controller = new Planck.Extension.StatusManager.Module.Status.Controller.Manage('.plk-status-manager');
        controller.initialize();
    }

});
;

Planck.Extension.RichTag = {};
Planck.Extension.RichTag.Module = {};
Planck.Extension.RichTag.Model = {};
Planck.Extension.RichTag.Model.Entity = {};
Planck.Extension.RichTag.Model.Repository = {};



;

Planck.Extension.RichTag.Module.Category = {
    View: {
        Component: {}
    },
    Controller: {}
};


;

Planck.Extension.RichTag.Module.Type = {
    View: {
        Component: {}
    },
    Controller: {}
};


;

Planck.Extension.Content = {};

Planck.Extension.Content.View = {};
Planck.Extension.Content.View.Component = {};

Planck.Extension.Content.View.Component.EntitySelector = {};

Planck.Extension.Content.Module = {};
Planck.Extension.Content.Model = {};
Planck.Extension.Content.Model.Entity = {};
Planck.Extension.Content.Model.Repository = {};









;
Planck.Extension.Content.Model.Entity.Article = function ()
{
    this.image = new Planck.Extension.Content.Model.Entity.Image();
    this.repository = new Planck.Extension.Content.Model.Repository.Article();

    this.entityType = 'Planck.Extension.Content.Model.Entity.Article';

};


Planck.Extension.Content.Model.Entity.Article.prototype.image = null;



/**
 *
 * @returns {Planck.Extension.Content.Model.Entity.Image}
 */
Planck.Extension.Content.Model.Entity.Article.prototype.getImage = function()
{
    return this.image;
};

/**
 *
 * @param {Planck.Extension.Content.Model.Entity.Image}image
 * @returns {Planck.Extension.Content.Model.Entity.Article}
 */
Planck.Extension.Content.Model.Entity.Article.prototype.setImage = function(image)
{

    this.setValue('image_id', image.getId());
    this.image = image;
    return this;
};




Planck.inherit(
    Planck.Extension.Content.Model.Entity.Article,
    Planck.Model.Entity
);

;
Planck.Extension.Content.Model.Entity.Image = function ()
{
    this.entityType = 'Planck.Extension.Content.Model.Entity.Image';
};



Planck.inherit(
    Planck.Extension.Content.Model.Entity.Image,
    Planck.Model.Entity
);

;
Planck.Extension.Content.Model.Entity.Status = function ()
{
    this.entityType = 'Planck.Extension.Content.Model.Entity.Status';
};



Planck.inherit(
    Planck.Extension.Content.Model.Entity.Status,
    Planck.Model.Entity
);

;
Planck.Extension.Content.Model.Repository.Article = function ()
{

};





Planck.Extension.Content.Model.Repository.Article.prototype.services = {
    save: {
        url: '?/tool/route/call&route=/content/article/api[save]',
        method: 'post'
    },
    delete: Planck.Model.Repository.prototype.services.delete
};





Planck.inherit(
    Planck.Extension.Content.Model.Repository.Article,
    Planck.Model.Repository
);

;
Planck.Extension.Content.Model.Repository.Image = function ()
{

};



Planck.inherit(
    Planck.Extension.Content.Model.Repository.Image,
    Planck.Model.Repository
);

;

Planck.Extension.Content.Module.Article = {
    Controller: {}
};

;


Planck.Extension.Content.Module.Article.Controller.Edit = function(options)
{

    this.$element = $('.plk-article-editor');

    this.article = new Planck.Extension.Content.Model.Entity.Article();

    this.options = $.extend({
        selector: '#article-form'
    }, options);



    this.form= null;
    this.formElement = $(this.options.selector);


    this.moduleContainer = new Planck.Extension.Content.Module.Article.Controller.Edit.Layout.ModuleContainer(
        this,
        '.plk-layout-editor-zone-right'
    );

    this.features = {};
};


Planck.Extension.Content.Module.Article.Controller.Edit.Layout = {};


Planck.Extension.Content.Module.Article.Controller.Edit.prototype.getModuleContainer = function()
{
    return this.moduleContainer;
};

Planck.Extension.Content.Module.Article.Controller.Edit.prototype.getElement = function()
{
   return this.$element;
};

Planck.Extension.Content.Module.Article.Controller.Edit.prototype.getArticle = function()
{
    return this.getDataLayer().get('article');
};




Planck.Extension.Content.Module.Article.Controller.Edit.prototype.initialize = function()
{


    this.articleEditor = $('.plk-rich-text-input[data-name=content]').data('manager');

    this.loadComponents();

    this.loadDataLayerFromDom(this.$element);

    this.article = this.getDataLayer().get('article');

    this.article.bindWithForm(this.formElement);
    this.article.loadValuesFromForm();
    this.article.setValue('html', this.$element.find('.plk-rich-text-html-value-container').val());


    this.articleEditor.setHeight(
        ($('#phi-main-container').get(0).offsetHeight-150)+'px'
    );


    this.initializeFeatures();

};

Planck.Extension.Content.Module.Article.Controller.Edit.prototype.initializeFeatures = function()
{



    var commonActionFeature = new Planck.Extension.Content.Module.Article.Controller.Edit.Features.CommonAction(this);
    commonActionFeature.initialize();
    this.loadFeature('commonAction', commonActionFeature);



    var imageCoverFeature = new Planck.Extension.Content.Module.Article.Controller.Edit.Features.ImageCover(this);
    imageCoverFeature.initialize();
    this.loadFeature('imageCover', imageCoverFeature);



    var qNameFeature = new Planck.Extension.Content.Module.Article.Controller.Edit.Features.QName(this);
    qNameFeature.initialize();
    this.loadFeature('qName', qNameFeature);


    var typeFeature = new Planck.Extension.Content.Module.Article.Controller.Edit.Features.Type(this);
    typeFeature.initialize();
    this.loadFeature('type', typeFeature);


    var tagFeature = new Planck.Extension.Content.Module.Article.Controller.Edit.Features.Tag(this);
    tagFeature.initialize();
    this.loadFeature('tag', tagFeature);

    var categoryFeature = new Planck.Extension.Content.Module.Article.Controller.Edit.Features.Category(this);
    categoryFeature.initialize();
    this.loadFeature('category', categoryFeature);
};





Planck.Extension.Content.Module.Article.Controller.Edit.prototype.loadFeature = function(featureName, featureInstance)
{
    this.features[featureName] = featureInstance;
    return this;
};









Planck.inherit(
    Planck.Extension.Content.Module.Article.Controller.Edit,
    Planck.Controller
);










//====================old
Planck.Extension.Content.Module.Article.Controller.Edit.prototype.updateCrop = function()
{
   var cropData = this.imageChooser.getCropData();

   var data = {
       property: 'crop',
       value: cropData,
       entity: this.article.getImage().getValues()
   };

   var url = '?/entity-editor/api/set-property';


   Planck.ajax({
        url:url,
        method: 'post',
        data: data,
        success: function(response) {
            console.log(response);
        }

   });

};


Planck.Extension.Content.Module.Article.Controller.Edit.prototype.createImage = function()
{


    this.imageChooser.sendImage({
        url: '?/content/image/api/save',
        data: {},
        callback: function (data) {

            var imageInstance = new Planck.Extension.Content.Model.Entity.Image();
            imageInstance.setValues(data);
            this.article.setImage(imageInstance);
            this.article.store();

            alert('moo');

            //this.article.getImage().setValues(data);

            console.log(this.article);

        }.bind(this)
    });

};


;
Planck.Extension.Content.Module.Article.Controller.Edit.Features = {};



Planck.Extension.Content.Module.Article.Controller.Edit.Feature = function()
{

};


Planck.Extension.Content.Module.Article.Controller.Edit.Feature.prototype.getContainer = function(title, contentClassName)
{
    var $element = $(
        '<div class="card">'+
            '<div class="card-body">'+
                '<div class="card-header">'+title+'</div>'+
                '<div class="'+contentClassName+'"></div>'+
            '</div>'+
        '</div>'
    );

    $element.$content = $element.find('.'+contentClassName);

    return $element;


};

Planck.Extension.Content.Module.Article.Controller.Edit.Feature.prototype.register = function(name)
{
    this.editor.getModuleContainer().addComponent(this, name);
};



Planck.Extension.Content.Module.Article.Controller.Edit.Feature.prototype.getElement = function()
{
    return this.$element;
};


;
Planck.Extension.Content.Module.Article.Controller.Edit.Features.Category = function(editor)
{
    this.editor = editor;

    /**
     * {Planck.Extension.ViewComponent.View.Component.EntityTree}
     */
    this.tree;
    this.ready = false;
};


Planck.Extension.Content.Module.Article.Controller.Edit.Features.Category.prototype.initialize = function()
{

    this.$element = this.getContainer('Categorie', 'category_input_container');

    this.initializeTree();

    this.register('category');



};

Planck.Extension.Content.Module.Article.Controller.Edit.Features.Category.prototype.initializeTree = function()
{

    this.categorySelector = new Planck.Extension.Content.View.Component.CategoryTree();
    this.tree = this.categorySelector.getTree();

    this.tree.on('load', function() {
        this.tree.selectNodeById(
            this.editor.getArticle().getValue('category_id')
        );
        this.ready = true;
    }.bind(this));

    this.tree.on('select', function(data) {
        this.editor.getArticle().setValue('category_id', data.node.id);
        if(this.editor.getArticle().getValue('id')) {
            if(this.ready) {
                this.editor.getArticle().store();
            }
        }
    }.bind(this));

    this.categorySelector.render(
        this.$element.find('.category_input_container')
    );

    return this.categorySelector;

};



Planck.inherit(
    Planck.Extension.Content.Module.Article.Controller.Edit.Features.Category,
    Planck.Extension.Content.Module.Article.Controller.Edit.Feature
);











;
Planck.Extension.Content.Module.Article.Controller.Edit.Features.CommonAction = function(editor)
{

    this.editor = editor;
    this.article = this.editor.getArticle();
};


Planck.Extension.Content.Module.Article.Controller.Edit.Features.CommonAction.prototype.initialize = function()
{
    this.$element = this.getContainer('Actions', 'commonAction');

    this.$saveButton = $('<button>Enregistrer</button>');
    this.$saveButton.click(function() {
        this.saveArticle(this.article);
    }.bind(this));


    this.$element.$content.append(this.$saveButton);
    this.register('commonAction');
};


Planck.Extension.Content.Module.Article.Controller.Edit.Features.CommonAction.prototype.saveArticle = function()
{
    this.article.loadValuesFromForm();
    this.article.setValue(
        'html',
        this.editor.getElement().find('.plk-rich-text-html-value-container').val()
    );


    this.article.store(function(descriptor) {

        console.log(this.article.getValues());
        //this.article = descriptor.entity;

    }.bind(this));

};




Planck.inherit(
    Planck.Extension.Content.Module.Article.Controller.Edit.Features.CommonAction,
    Planck.Extension.Content.Module.Article.Controller.Edit.Feature
);






;
Planck.Extension.Content.Module.Article.Controller.Edit.Features.ImageCover = function(editor)
{
    this.editor = editor;
    this.image = this.editor.getArticle().getImage();
};


Planck.Extension.Content.Module.Article.Controller.Edit.Features.ImageCover.prototype.initialize = function()
{

    this.$element = this.getContainer('Image de couverture <i class="fas fa-edit main-image-trigger"></i>', 'image-preview');

    if(this.image.getValue('url')) {

        var image = $('<img src="'+this.image.getValue('url')+'" style="width:100%"/>');
        var inputValue = $('<input name="image_id" class="form-data" style="display: none" value="'+this.image.getValue('id')+'"/>');
        this.$element.find('.image-preview').append(image);
        this.$element.find('.image-preview').append(inputValue);
    }

    this.register('imageCover');

    this.initializeChooseImage();
};


Planck.Extension.Content.Module.Article.Controller.Edit.Features.ImageCover.prototype.initializeChooseImage = function()
{

    this.$element.find('.main-image-trigger').click(function(event) {


        var overlay = new Planck.Extension.ViewComponent.View.Component.Overlay();
        overlay.render(document.body);


        var imageList = new Planck.Extension.Content.Module.Image.View.Component.Gallery();


        imageList.on('thumbnailClick', function (thumbnail) {

            var imageInstance = thumbnail.getDataLayer().get('image');


            this.editor.getArticle().setValue('image_id', imageInstance.getId());

            this.$element.find('.image-preview').html(
                '<img src="'+imageInstance.getValue('url')+'" style="width:100%"/>'
            );


            if(this.editor.getArticle().getValue('id')) {
                this.editor.getArticle().store();
            }

            overlay.destroy();

        }.bind(this));


        var remoteCall = imageList.getRemoteCallInstance();

        remoteCall.addMethodCall('loadAllImages', {
            parameters: null
        });

        remoteCall.load(function (descriptor) {

            var dom = $(descriptor.getHTML());
            imageList.setElement(dom);

            overlay.show(
                imageList.getElement()
            );
        }.bind(this));
        return false;
    }.bind(this));

};







Planck.inherit(
    Planck.Extension.Content.Module.Article.Controller.Edit.Features.ImageCover,
    Planck.Extension.Content.Module.Article.Controller.Edit.Feature
);













;
Planck.Extension.Content.Module.Article.Controller.Edit.Features.QName = function(editor)
{
    this.editor = editor;
    this.article = this.editor.getArticle();

    this.article.onStore(function() {
    }.bind(this));

};


Planck.Extension.Content.Module.Article.Controller.Edit.Features.QName.prototype.initialize = function()
{

    this.$element = this.getContainer('Identifiant unique', 'qname_input_container');

    this.register('qname');

    var $container = $(
        '<div style="display:flex"></div>'
    );

    this.$element.$content.html($container)


    this.$input = $('<input name="qname" style="flex:1" class="form-data"/>');
    this.$submitButton = $('<button style="">ok</button>');

    this.$input.val(this.article.getValue('qname'));


    $container.append(this.$input);
    $container.append(this.$submitButton);

    this.$submitButton.click(function() {
        this.updateArticleQName();
    }.bind(this));
};


Planck.Extension.Content.Module.Article.Controller.Edit.Features.QName.prototype.updateArticleQName = function()
{
    var value = this.$input.val();


    if(this.article.getValue('id')) {
        this.article.setValue('qname', value);
        this.article.store();
    }

    return this;
};



Planck.inherit(
    Planck.Extension.Content.Module.Article.Controller.Edit.Features.QName,
    Planck.Extension.Content.Module.Article.Controller.Edit.Feature
);











;
Planck.Extension.Content.Module.Article.Controller.Edit.Features.Tag = function(editor)
{
    this.services = {
        tag: {
            save: {
                url:'?/content/article/api/save-tags',
                method: 'post'
            }
        }
    };

    this.editor = editor;
    this.article = this.editor.getArticle();
};


Planck.Extension.Content.Module.Article.Controller.Edit.Features.Tag.prototype.initialize = function()
{

    var component = new Planck.Extension.ViewComponent.Component();

    var loader = component.getRemoteCallInstance('Planck\\Extension\\RichTag\\View\\Component\\EntityTagInput');
    loader.addMethodCall('loadEntityById', [
            'Planck\\Extension\\Content\\Model\\Entity\\Article',
            this.article.getValue('id')
        ]
    );

    loader.load(function(response) {

        var tagInputElement = $(response.html);

        this.$element = this.getContainer('Tags', 'tag_input_container');
        this.$element.find('.tag_input_container').append(tagInputElement);

        this.$tagManager = new Planck.Extension.FormComponent.View.Component.TagInput(tagInputElement);
        this.$tagManager.initialize();

        this.$tagManager.on('change', function(tagManager) {
            this.updateTags(tagManager);
        }.bind(this));

        this.register('tag');

    }.bind(this));
};


Planck.Extension.Content.Module.Article.Controller.Edit.Features.Tag.prototype.updateTags = function()
{
    if(!this.article.getValue('id')) {
        return false;
    }
    var data = {
        article: this.article.getValues(),
        tags: this.$tagManager.getValues()
    };

    Planck.ajax({
        url: this.services.tag.save.url,
        method: this.services.tag.save.method,
        data: data,
        success: function(reponse) {

        }.bind(this)
    });
};


Planck.inherit(
    Planck.Extension.Content.Module.Article.Controller.Edit.Features.Tag,
    Planck.Extension.Content.Module.Article.Controller.Edit.Feature
);

















;
Planck.Extension.Content.Module.Article.Controller.Edit.Features.Type = function(editor)
{
    this.editor = editor;

    /**
     * {Planck.Extension.ViewComponent.View.Component.EntityTree}
     */
    this.tree;
};


Planck.Extension.Content.Module.Article.Controller.Edit.Features.Type.prototype.initialize = function()
{

    this.$element = this.getContainer('Type', 'type_input_container');

    this.initializeTree();

    this.register('type');

    this.ready = false;

};

Planck.Extension.Content.Module.Article.Controller.Edit.Features.Type.prototype.initializeTree = function()
{

    this.typeSelector = new Planck.Extension.Content.View.Component.TypeTree();
    this.tree = this.typeSelector.getTree();


    this.tree.on('load', function() {
        this.tree.selectNodeById(
            this.editor.getArticle().getValue('type_id')
        );
        this.ready = true;
    }.bind(this));


    this.tree.on('select', function(data) {
        this.editor.getArticle().setValue('type_id', data.node.id);
        if(this.editor.getArticle().getValue('id')) {
            if(this.ready) {
                this.editor.getArticle().store();
            }

        }
    }.bind(this));

    this.tree.render(
        this.$element.find('.type_input_container')
    );

    return this.typeSelector;


};



Planck.inherit(
    Planck.Extension.Content.Module.Article.Controller.Edit.Features.Type,
    Planck.Extension.Content.Module.Article.Controller.Edit.Feature
);











;
Planck.Extension.Content.Module.Article.Controller.Edit.Layout.ModuleContainer = function(editor, selector)
{
    this.editor = editor;
    this.$element = $(selector);

    this.components = {};


};

Planck.Extension.Content.Module.Article.Controller.Edit.Layout.ModuleContainer.prototype.addComponent = function(component, name)
{
    this.components[name] = component;


    this.$element.append(
       component.getElement()
    );


};



;


Planck.Extension.Content.Module.Article.Controller.Listing = function(options)
{

};


Planck.Extension.Content.Module.Article.Controller.Listing.prototype.initialize = function()
{
    $('article .delete-trigger').click(function(event) {
        var articleId = event.target.getAttribute('data-article-id');

        var container = $(event.target).parents('article');

        this.confirmDeleteArticle(articleId, container);
    }.bind(this));

};

Planck.Extension.Content.Module.Article.Controller.Listing.prototype.confirmDeleteArticle = function(articleId, container)
{

    //this.deleteArticle(articleId, container);
    //return;

    var confirm = new Planck.Extension.ViewComponent.View.Component.Confirm(document.body);
    confirm.onConfirm(function() {
        this.deleteArticle(articleId, container);
    }.bind(this))
    confirm.show();

};


Planck.Extension.Content.Module.Article.Controller.Listing.prototype.deleteArticle = function(articleId, container)
{
    var article = new Planck.Extension.Content.Model.Entity.Article();
    article.setValue('id', articleId);
    article.delete();
    $(container).remove();

};


;

Planck.Extension.Content.Module.Image = {
    View: {
        Component: {}
    },
    Controller: {}
};


;
Planck.Extension.Content.Module.Image.Controller.Gallery = function()
{
    this.$element = $('.plk-image-list');


    var thumbnailComponentName='Planck.Extension.Content.Module.Image.View.Component.Thumbnail'
    this.components[thumbnailComponentName] = [];
    this.thumbnails = this.components[thumbnailComponentName];


};

Planck.Extension.Content.Module.Image.Controller.Gallery.prototype.initialize = function()
{
    Planck.Controller.prototype.initialize.call(this);

};





Planck.inherit(
    Planck.Extension.Content.Module.Image.Controller.Gallery,
    Planck.Controller
);





;
Planck.Extension.Content.Module.Image.View.Component.Detail = function(container)
{
    if(container) {
        this.setElement(container);
        this.initialize();
        this.loadDataLayerFromDom();
    }
    this.image = null;
    this.cropper = null;
    this.form = null


    this.events = {
        'beforeSubmit' : function(instance)
        {

        },
       'afterSubmit' : function(instance)
       {

       }
    };
};

Planck.Extension.Content.Module.Image.View.Component.Detail.prototype.image;




Planck.Extension.Content.Module.Image.View.Component.Detail.prototype.getRemoteCallInstance = function()
{
    return this.parent.getRemoteCallInstance.call(this,
        'Planck.Extension.Content.Module.Image.View.Component.Detail'
    );
};


Planck.Extension.Content.Module.Image.View.Component.Detail.prototype.getViewFromRemote = function(callback)
{
    this.parent.getViewFromRemote.call(
        this,

        'Planck.Extension.Content.Module.Image.View.Component.Detail',
        null,
        function(descriptor) {
            this.initializeCropper();
            this.initializeForm();

            Planck.Extension.FormComponent.initialize(this.getElement());

            if(callback) {
                callback(descriptor);
            }
        }.bind(this)
    );
};


Planck.Extension.Content.Module.Image.View.Component.Detail.prototype.initializeCropper = function()
{

    var image = this.$element.find('.plk-image-detail-preview img').get(0);
    var cropOptions = {
        autoCrop: true
    };

    if(this.getDataLayer().get('image').getProperty('crop')) {
        var values = this.getDataLayer().get('image').getProperty('crop').value;
        for(var name in values) {
            values[name] = parseFloat(values[name]);
        }
        cropOptions.data = values;
    }

    this.cropper = new Cropper(image, cropOptions);
};


Planck.Extension.Content.Module.Image.View.Component.Detail.prototype.initializeForm = function()
{




    var formElement = this.$element.find('form.image-data-form');
    this.form = new Khi.AjaxForm(formElement);
    if(this.cropper) {
        this.form.on('beforeSubmit', function() {
            this.form.addData('crop', this.getCropData());

            return true;
        }.bind(this));
    }



    this.form.on('afterSubmit', function(dataLayer) {


        console.log(dataLayer);

        this.loadDataLayer(dataLayer);
        this.events.afterSubmit(this);
    }.bind(this));
};

Planck.Extension.Content.Module.Image.View.Component.Detail.prototype.getCropData = function()
{
    return this.cropper.getData();
};



Planck.inherit(
    Planck.Extension.Content.Module.Image .View.Component.Detail,
    Planck.Extension.ViewComponent.Component
);


;
Planck.Extension.Content.Module.Image.View.Component.Gallery = function(container)
{
    if(container) {
        this.setElement(container);
        this.initialize();
        this.loadDataLayerFromDom();
    }



    this.events = {
       thumbnailClick: function(thumbnail) {
            this.showImageDetails(thumbnail);
       }.bind(this)
    };


    var thumbnailComponentName='Planck.Extension.Content.Module.Image.View.Component.Thumbnail'
    this.subComponents[thumbnailComponentName] = [];
    this.thumbnails = this.subComponents[thumbnailComponentName];


    this.overlay = new Planck.Extension.ViewComponent.View.Component.Overlay();
    this.overlay.render(document.body);
};


Planck.Extension.Content.Module.Image.View.Component.Gallery.prototype.on = function(eventName, callback)
{
   this.events[eventName] = callback;
   return this;
};


Planck.Extension.Content.Module.Image.View.Component.Gallery.prototype.initialize = function()
{

    this.parent.initialize.call(this);
    this.initializeDropImageUpload();


    $(this.thumbnails).each(function(index, thumbnail) {
        this.initializeThumbnail(thumbnail);
    }.bind(this));
};

Planck.Extension.Content.Module.Image.View.Component.Gallery.prototype.initializeThumbnail = function(thumbnail)
{
    thumbnail.onClick(function(thumbnail) {
        this.events.thumbnailClick(thumbnail);
    }.bind(this));

};




Planck.Extension.Content.Module.Image.View.Component.Gallery.prototype.getRemoteCallInstance = function()
{
    var remoteCall = new Planck.Extension.ViewComponent.RemoteComponentLoader('Planck.Extension.Content.Module.Image.View.Component.Gallery');
    remoteCall.addData('dataLayer', this.getDataLayer().serialize());
    return remoteCall;

};





Planck.Extension.Content.Module.Image.View.Component.Gallery.prototype.getViewFromRemote = function(callback)
{

    this.parent.getViewFromRemote.call(this,
        'Planck.Extension.Content.Module.Image.View.Component.Gallery',
        null,

        function(descriptor) {
            Planck.Extension.ViewComponent.initialize(this.getElement());

            if(callback) {
                callback(descriptor);
            }
        }.bind(this)
    );


};




Planck.Extension.Content.Module.Image.View.Component.Gallery.prototype.showImageDetails = function(thumbnail)
{


    var imageDetail = new Planck.Extension.Content.Module.Image.View.Component.Detail();


    imageDetail.setDataLayer(thumbnail.getDataLayer());
    imageDetail.on('afterSubmit', function(instance) {
        this.overlay.hide();
    }.bind(this));



    imageDetail.getViewFromRemote(function() {

        this.overlay.show(imageDetail.getElement());
    }.bind(this));

    return;
};




Planck.Extension.Content.Module.Image.View.Component.Gallery.prototype.addThumbnail = function(dataLayer)
{

    var thumbnail = new Planck.Extension.Content.Module.Image.View.Component.Thumbnail();


    thumbnail.loadDataLayer(dataLayer);


    thumbnail.getViewFromRemote(
        function(descriptor) {
            this.$contentElement.append(thumbnail.getElement());
            this.thumbnails.push(thumbnail);
            this.initializeThumbnail(thumbnail);

        }.bind(this)
    );
};


Planck.Extension.Content.Module.Image.View.Component.Gallery.prototype.initializeDropImageUpload = function()
{

    var imageDropZone = new Planck.Component.DropZone(this.$element);
    imageDropZone.on('upload', function(datalayer) {

        $(datalayer).each(function(index, dataLayerRecord) {
            var dataLayer = {
                image: dataLayerRecord
            };

            this.addThumbnail(dataLayer);
        }.bind(this));

    }.bind(this));



};



Planck.inherit(
    Planck.Extension.Content.Module.Image .View.Component.Gallery,
    Planck.Extension.ViewComponent.Component
);




;




Planck.Extension.Content.Module.Image.View.Component.Thumbnail = function(container)
{
    if(container) {
        this.setElement(container);
        this.initialize();
        this.loadDataLayerFromDom();
    }


};




Planck.Extension.Content.Module.Image.View.Component.Thumbnail.prototype.initialize = function()
{

    this.parent.initialize.call(this);

    var image = this.getDataLayer().get('image');
    if(image) {
        this.image = image;
    }

    this.initializeDeleteButton();

};

Planck.Extension.Content.Module.Image.View.Component.Thumbnail.prototype.initializeDeleteButton = function()
{
    this.getToolbar().getDeleteButton().click(function(event) {

        var confirm = new Planck.Extension.ViewComponent.View.Component.Confirm(document.body);
        confirm.show();
        confirm.onConfirm(function() {
            this.image.delete(function() {
                this.destroy();
            }.bind(this));
        }.bind(this));


        event.stopPropagation();



    }.bind(this));

};




Planck.Extension.Content.Module.Image.View.Component.Thumbnail.prototype.image = new Planck.Extension.Content.Model.Entity.Image();


Planck.Extension.Content.Module.Image.View.Component.Thumbnail.prototype.getImage = function()
{
   return this.image;
};



Planck.Extension.Content.Module.Image.View.Component.Thumbnail.prototype.getViewFromRemote = function(callback)
{

    return this.parent.getViewFromRemote.call(
        this,
        'Planck.Extension.Content.Module.Image.View.Component.Thumbnail',
        null,
        callback
    );
};







Planck.inherit(
    Planck.Extension.Content.Module.Image .View.Component.Thumbnail,
    Planck.Extension.ViewComponent.Component
);


;
Planck.Extension.Content.View.Component.CategoryTree = function()
{
    var options = {
        sourceURL: '?/content/category/api/get-tree',
        createNodeURL: '?/content/category/api/save',
        renameNodeURL: '?/content/category/api/save',
        moveNodeURL: '?/content/category/api/move',
        deleteURL: '?/content/category/api/delete',
        deleteBranchURL: '?/content/category/api/delete-branch',
    };

    this.tree = new Planck.Extension.ViewComponent.View.Component.EntityTree(options)


};


Planck.Extension.Content.View.Component.CategoryTree.prototype.render = function(container)
{

    this.$container = $(container);
    this.tree.render(this.$container);
};

Planck.Extension.Content.View.Component.CategoryTree.prototype.getTree = function()
{
    return this.tree;
};
;
Planck.Extension.Content.View.Component.TypeTree = function()
{
    var options = {
        sourceURL: '?/type/api/get-tree',
        createNodeURL: '?/type/api/save',
        renameNodeURL: '?/type/api/save',
        moveNodeURL: '?/type/api/move',
        deleteURL: '?/type/api/delete',
        deleteBranchURL: '?/type/api/delete-branch',
    };

    this.tree = new Planck.Extension.ViewComponent.View.Component.EntityTree(options)


    this.tree.on('load', function() {
    }.bind(this));


    this.tree.on('select', function(data) {
    }.bind(this));
};


Planck.Extension.Content.View.Component.TypeTree.prototype.render = function(container)
{

    this.$container = $(container);
    this.tree.render(this.$container);
};

Planck.Extension.Content.View.Component.TypeTree.prototype.getTree = function()
{
    return this.tree;
};
;
Planck.Extension.Content.View.Component.EntitySelector.ContentCategory = function(triggerElement)
{
    this.$triggerElement = $(triggerElement);
    this.$triggerElement.hide();



    this.$label = this.getLabel();


    this.$label.html(i18n('<div class="button"data-behaviour="interactive" ><span>Catégorie</span></div>'));




    this.categoryId = this.$triggerElement.attr('value');


    this.$valueInput = $('<input name="'+this.$triggerElement.attr('name')+'" value="'+this.categoryId+'" style="display: none"/>');

    this.$previewContainer = $('<div class="plk-entity-selector-preview"></div>');
    this.$triggerElement.parent().append(this.$valueInput);
    this.$triggerElement.parent().append(this.$previewContainer);



    this.$label.click(function() {
        this.showCategorySelector();
    }.bind(this));

    this.loadPreview(this.categoryId)

};

Planck.Extension.Content.View.Component.EntitySelector.ContentCategory.prototype.loadPreview = function(categoryId)
{
    if(!categoryId) {
        return false;
    }

    var url = '?/@extension/planck-extension-entity_editor/entity/api[get]';
    var data = {
        entity: 'Planck\\Extension\\Content\\Model\\Entity\\Category',
        id: categoryId
    };
    Planck.ajax({
        url: url,
        method: 'get',
        data: data,
        success: function(response) {

            this.setPreview(response.values.name);

        }.bind(this)
    });
};


Planck.Extension.Content.View.Component.EntitySelector.ContentCategory.prototype.setPreview = function(label)
{
    this.$previewContainer.html('<span>'+label+'</span>');
};



Planck.Extension.Content.View.Component.EntitySelector.ContentCategory.prototype.showCategorySelector = function()
{

    var $content = $('<div class="category-tree-container"></div>')

    var floatingBox = new Planck.Extension.ViewComponent.View.Component.FloatingBox(
        this.$label,
        $content
    );

    this.tree = new Planck.Extension.Content.View.Component.CategoryTree();
    this.tree.render($content);
    this.tree.getTree().on('select', function(data) {
        var categoryId = data.node.id;

        this.$valueInput.val(categoryId);
        this.setPreview(data.node.text);
        floatingBox.destroy();
    }.bind(this));

    floatingBox.show();

};



Planck.inherit(
    Planck.Extension.Content.View.Component.EntitySelector.ContentCategory,
    Planck.Extension.EntityEditor.View.Component.EntityChooser
);




//==================================================


if(!isset(Planck.Extension.EntityEditor.entityMapping['Planck\\Extension\\Content\\Model\\Entity\\Category'])) {
    Planck.Extension.EntityEditor.entityMapping['Planck\\Extension\\Content\\Model\\Entity\\Category'] = Planck.Extension.Content.View.Component.EntitySelector.ContentCategory;
}
;
Planck.Extension.Content.View.Component.EntitySelector.ContentImage = function(triggerElement)
{
    this.$triggerElement = $(triggerElement);
    this.$triggerElement.hide();

    this.$label = this.getLabel();

    this.$label.html(i18n('<div class="button" data-behaviour="interactive"><span>Image</span></div>'));

    this.imageId = this.$triggerElement.attr('value');


    this.$valueInput = $('<input name="'+this.$triggerElement.attr('name')+'" value="'+this.imageId+'" style="display: none"/>');
    this.$previewContainer = $('<div class="plk-entity-selector-preview"></div>');

    this.$triggerElement.parent().append(this.$valueInput);
    this.$triggerElement.parent().append(this.$previewContainer);


    this.$label.click(function() {
        this.showImageChooser();
    }.bind(this));

    this.loadPreview(this.imageId);
};

Planck.Extension.Content.View.Component.EntitySelector.ContentImage.prototype.loadPreview = function(imageId)
{


   if(!imageId) {
       return false;
   }

   var url = '?/@extension/planck-extension-entity_editor/entity/api[get]';
   var data = {
       entity: 'Planck\\Extension\\Content\\Model\\Entity\\Image',
       id: imageId
   };
   Planck.ajax({
       url: url,
       method: 'get',
       data: data,
       success: function(response) {
           this.setPreview(response.values.url);
            //console.log(response);
       }.bind(this)
   });
};

Planck.Extension.Content.View.Component.EntitySelector.ContentImage.prototype.setPreview = function(url)
{
    this.$previewContainer.html('<img src="'+url+'"/>');
};


Planck.Extension.Content.View.Component.EntitySelector.ContentImage.prototype.showImageChooser = function()
{



    var overlay = new Planck.Extension.ViewComponent.View.Component.Overlay();
    overlay.render(document.body);


    var imageList = new Planck.Extension.Content.Module.Image.View.Component.Gallery();

    imageList.on('thumbnailClick', function (thumbnail) {
        var imageInstance = thumbnail.getDataLayer().get('image');
        overlay.destroy();

        this.$valueInput.val(imageInstance.getValue('id'));
        this.setPreview(imageInstance.getValue('url'));


    }.bind(this));



    var remoteCall = imageList.getRemoteCallInstance();

    remoteCall.addMethodCall('loadAllImages', {
        parameters: null
    });

    remoteCall.load(function (descriptor) {

        var dom = $(descriptor.getHTML());
        imageList.setElement(dom);

        overlay.show(
            imageList.getElement()
        );
    }.bind(this));
    return false;





};

Planck.inherit(
    Planck.Extension.Content.View.Component.EntitySelector.ContentImage,
    Planck.Extension.EntityEditor.View.Component.EntityChooser
);




//==================================================


if(!isset(Planck.Extension.EntityEditor.entityMapping['Planck\\Extension\\Content\\Model\\Entity\\Image'])) {
    Planck.Extension.EntityEditor.entityMapping['Planck\\Extension\\Content\\Model\\Entity\\Image'] = Planck.Extension.Content.View.Component.EntitySelector.ContentImage;
}

;
Planck.Extension.Content.View.Component.EntitySelector.ContentType = function(triggerElement)
{
    this.$triggerElement = $(triggerElement);
    this.$triggerElement.hide();

    this.$label = this.getLabel();


    this.$label.html(i18n('<div class="button" data-behaviour="interactive"><span>Type</span></div>'));




    this.typeId = this.$triggerElement.attr('value');


    this.$valueInput = $('<input name="'+this.$triggerElement.attr('name')+'" value="'+this.typeId+'" style="display: none"/>');
    this.$previewContainer = $('<div class="plk-entity-selector-preview"></div>');

    this.$triggerElement.parent().append(this.$valueInput);
    this.$triggerElement.parent().append(this.$previewContainer);



    this.$label.click(function() {
        this.showCategorySelector();
    }.bind(this));

    this.loadPreview(this.typeId);
};



Planck.Extension.Content.View.Component.EntitySelector.ContentType.prototype.loadPreview = function(entityId)
{
    if(!entityId) {
        return false;
    }

    var url = '?/@extension/planck-extension-entity_editor/entity/api[get]';
    var data = {
        entity: 'Planck\\Extension\\Content\\Model\\Entity\\Type',
        id: entityId
    };
    Planck.ajax({
        url: url,
        method: 'get',
        data: data,
        success: function(response) {

            this.setPreview(response.values.name);

        }.bind(this)
    });
};

Planck.Extension.Content.View.Component.EntitySelector.ContentType.prototype.setPreview = function(label)
{
    this.$previewContainer.html('<span>'+label+'</span>');
};



Planck.Extension.Content.View.Component.EntitySelector.ContentType.prototype.showCategorySelector = function()
{

    var $content = $('<div class="category-tree-container"></div>')

    var floatingBox = new Planck.Extension.ViewComponent.View.Component.FloatingBox(
        this.$label,
        $content
    );


    this.tree = new Planck.Extension.Content.View.Component.TypeTree();
    this.tree.render($content);

    this.tree.getTree().on('select', function(data) {
        var typeId = data.node.id;
        this.$valueInput.val(typeId);

        this.setPreview(data.node.text);
        floatingBox.destroy();

    }.bind(this));


    floatingBox.show();
};



Planck.inherit(
    Planck.Extension.Content.View.Component.EntitySelector.ContentType,
    Planck.Extension.EntityEditor.View.Component.EntityChooser
);




//==================================================


if(!isset(Planck.Extension.EntityEditor.entityMapping['Planck\\Extension\\Content\\Model\\Entity\\Type'])) {
    Planck.Extension.EntityEditor.entityMapping['Planck\\Extension\\Content\\Model\\Entity\\Type'] = Planck.Extension.Content.View.Component.EntitySelector.ContentType;
}
;
$(function() {

    if(document.location.toString().match(/\/content\/article\/edit/)) {
        Planck.Extension.FormComponent.initialize(document.body);
        var controller = new Planck.Extension.Content.Module.Article.Controller.Edit();
        controller.initialize();
    }

    if(document.location.toString().match(/\/articles/)) {
        //Planck.Extension.FormComponent.initialize(document.body);
        var controller = new Planck.Extension.Content.Module.Article.Controller.Listing();
        controller.initialize();
    }


});
;
$(function() {


    var controller = new Planck.Extension.Content.Module.Image.Controller.Gallery();
    controller.initialize();
});
;
