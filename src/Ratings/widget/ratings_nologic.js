define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/dom-attr",
    "dojo/dom-class",
    "dojo/_base/lang",
    "dojo/text!Ratings/widget/templates/ratings.html"
], function (declare, _WidgetBase, _TemplatedMixin, domAttr, domClass, lang, widgetTemplate) {
        "use strict";

        return declare("Ratings.widget.ratings_nologic", [ _WidgetBase, _TemplatedMixin ], {
            templateString : widgetTemplate,
            name : "",
            voteEnabled : false,
            standardImage : "",
            mouseoverImage : "",

            divNode : "",
            mouseoverArray : null,
            root : window.mx.appUrl,
            ratingsListEvent : "",

            oldvalue : 0,
            newvalue : 0,

            onChange : function(){
            },

            //returns the value of this widget
            _getValueAttr : function(){
                logger.debug(this.id + "._getValueAttr");
                return this.newvalue;
            },

            //provides th value of this widget
            _setValueAttr : function(value){
                logger.debug(this.id + "._setValueAttr");
                this.oldvalue = parseInt(value, 10);
                this.newvalue = parseInt(value, 10);
                if (this.newvalue > 0) {
                    this.setRating(this.newvalue);
                } else {
                    if (this.voteEnabled === true) {//set default value
                        this.newvalue = 0; //do not detach
                        this.onChange();
                    }
                    this.showCurrentValue();
                }
            },

            postCreate : function(){
                logger.debug(this.id + ".postCreate");

                this.mouseoverArray = [];

                domClass.add(this.domNode, "ratings_widget");
                var ratingsList = mxui.dom.create("ul");

                if (this.voteEnabled === true) {
                    this.ratingsListEvent = this.connect(ratingsList, "onmouseleave", lang.hitch(this, this.showCurrentValue));
                }
                for (var i = 1; i <= 5; i++) {
                    var imgNode = mxui.dom.create("img",{"class": "ratings_image"}),
                        ratingsLi = mxui.dom.create("li", imgNode);

                    this.mouseoverArray[i-1] = {};
                    this.mouseoverArray[i-1].element = imgNode;
                    if (this.voteEnabled === true) { //can vote and not voted before
                        this.mouseoverArray[i-1].handlein = this.connect(imgNode, "onmouseenter", lang.hitch(this, this.displayImages, i));
                        this.mouseoverArray[i-1].handleout = this.connect(imgNode, "onmouseleave", lang.hitch(this, this.displayImages, i-1));
                        this.mouseoverArray[i-1].handleclick = this.connect(ratingsLi, "onclick", lang.hitch(this, this.setRating, i));
                    }
                    ratingsList.appendChild(ratingsLi);
                }

                this.domNode.appendChild(ratingsList);
                this.showCurrentValue();
                //NOT for attribute widgets: this.actRendered();
            },

            showCurrentValue : function () {
                this.displayImages(this.newvalue);
            },

            displayImages : function (iterator) {
                logger.debug(this.id + ".displayImages");

                if (iterator < 0 || iterator > 5) {
                    return;
                }

                for (var j = 0; j <= iterator-1; j++) {
                    domAttr.set(this.mouseoverArray[j].element, "src", this._getImagePath(this.mouseoverImage));
                }

                for (var k = 4; k > iterator-1; k--) {
                    domAttr.set(this.mouseoverArray[k].element, "src", this._getImagePath(this.standardImage));
                }
            },

            setRating : function(count) {
                logger.debug(this.id + ".onclickRating");
                this.newvalue = count;
                if (this.newvalue !== this.oldvalue) {
                    this.onChange();
                }

                this.displayImages(count);
                for (var i = 0; i < this.mouseoverArray.length; i++) {
                    if (this.mouseoverArray[i].handlein){
                        this.disconnect(this.mouseoverArray[i].handlein);
                    }
                    if (this.mouseoverArray[i].handleout) {
                        this.disconnect(this.mouseoverArray[i].handleout);
                    }
                }
            },

            _getImagePath : function (img) {
                return (this.root + (this.root.indexOf("localhost") !== -1 ? "/" : "" ) + img).split("?")[0]; // fix image path and remove cachebust
            },

            mouseleaveEvent : function(showVote, event) {
                logger.debug(this.id + ".mouseleaveEvent");
                this.setMouseOver(showVote - 1);
            },

            uninitialize : function(){
                logger.debug(this.id + ".uninitialize");
                for (var i = 0; i < this.mouseoverArray.length; i++){
                    if (this.mouseoverArray[i].handlein){
                        this.disconnect(this.mouseoverArray[i].handlein);
                    }
                    if (this.mouseoverArray[i].handleout) {
                        this.disconnect(this.mouseoverArray[i].handleout);
                    }
                    if (this.mouseoverArray[i].handleclick) {
                        this.disconnect(this.mouseoverArray[i].handleclick);
                    }
                }
            }
        });
});

require(["Ratings/widget/ratings_nologic"]);
