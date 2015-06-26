/*jslint white:true, nomen: true, plusplus: true */
/*global mx, define, require, browser, devel, console, document, jQuery, ga, window, mxui, location */
/*mendix */
/*
    Ratings
    ========================

    @file      : Ratings.js
    @version   : 2.0.0
    @author    : Gerhard Richard Edens
    @date      : Wed, 20 May 2015 12:17:18 GMT
    @copyright : Mendix b.v.
    @license   : Apache 2

    Documentation
    ========================
    Describe your widget here.
*/

// Required module list. Remove unnecessary modules, you can always get them back from the boilerplate.
define([
    "dojo/_base/declare", "mxui/widget/_WidgetBase", "dijit/_TemplatedMixin",
    "mxui/dom", "dojo/dom", "dojo/query", "dojo/dom-prop", "dojo/dom-geometry", "dojo/dom-attr", "dojo/dom-class", "dojo/dom-style", "dojo/dom-construct", "dojo/on", "dojo/_base/lang", "dojo/text", "dojo/number", "dojo/_base/array",
    "dojo/text!Ratings/widget/templates/ratings.html"
], function (declare, _WidgetBase, _TemplatedMixin, 
              domMx, dom, domQuery, domProp, domGeom, domAttr, domClass, domStyle, domConstruct, on, lang, text, number, dojoArray, widgetTemplate) {
    "use strict";

    return declare("Ratings.widget.ratings", [ _WidgetBase, _TemplatedMixin ], {

        templateString    : widgetTemplate,

        divNode : "",
        attrValues : null,
        hasVoted : true,
        connectArray : null,
        mouseoverArray : null,
        root : "",
        ratingsListEvent : "",
        pathAttr : "",
        pathName : "",

        postCreate : function(){
            console.log(this.id + ".postCreate");
            this.root = location.protocol + "//" + location.host;

            this.attrValues = [];
            this.connectArray = [];
            this.mouseoverArray = [];
            this.pathAttr = this.voteAttr.split("/");
            this.pathName = this.voteName.split("/");

            this.initContext();

            this.actRendered();
        },

        showRatings : function(mxApp){
            console.log(this.id + ".showRatings");

            /* CLEAR ALL NODES */
            domConstruct.empty(this.divNode);

            var showTotal, showCount, showVote, ratingsList, i, imgNode, ratingsLi;
            showTotal = 0;
            showCount = 0;
            showVote = 0;

            if (mxApp instanceof Array) {
                mxApp = mxApp[0];
            }

            ratingsList = "";

            //retrieve and calculate the vote values
            showTotal = mxApp.getAttribute(this.ratingsTotal);
            showCount = mxApp.getAttribute(this.ratingsCount);
            if (showCount === 0) {
                showVote = 1;
            } else {
                showVote = number.round((showTotal / showCount));
            }
            ratingsList = mxui.dom.create("ul");
            if (this.voteEnabled === true) {
                this.ratingsListEvent = this.connect(ratingsList, "onmouseleave", lang.hitch(this, this.mouseleaveEvent, showVote));
            }

            for (i = 1; i <= 5; i++) {
                imgNode = mxui.dom.create("img",{"class": "ratings_image"});
                if (i > showVote) {
                    domAttr.set(imgNode, "src", (this.root + "/" + this.standardImage));
                } else {
                    domAttr.set(imgNode, "src", (this.root + "/" + this.mouseoverImage));
                }
                ratingsLi = mxui.dom.create("li", imgNode);
                if (this.voteEnabled === true) {
                    this.mouseoverArray[i-1] = {};
                    this.mouseoverArray[i-1].handle = this.connect(imgNode, "onmouseenter", lang.hitch(this, this.mouseenterEvent, i));
                    this.mouseoverArray[i-1].element = imgNode;
                    //dojo.connect(imgNode, "onmouseleave", lang.hitch(this, this.mouseleaveEvent, i));
                    this.connectArray[i-1] = this.connect(ratingsLi, "onclick", lang.hitch(this, this.onclickRating, i, mxApp));
                }
                ratingsList.appendChild(ratingsLi);
            }
            this.divNode.appendChild(ratingsList);
        },

        setMouseOver : function (iterator) {
            console.log(this.id + ".setMouseOver");

            var j,k;

            for (j = 0; j <= iterator; j++) {
                this.mouseoverArray[j].element.src = this.root + "/" + this.mouseoverImage;
            }

            for (k = 4; k > iterator; k--) {
                this.mouseoverArray[k].element.src = this.root + "/" + this.standardImage;
            }

        },

        onclickRating : function(count, mxApp, event) {
            console.log(this.id + ".onclickRating");

            var i, currentUserName, xpathString;

            // user can click only once
            this.disconnect(this.ratingsListEvent);
            for (i = 0; i < this.mouseoverArray.length; i++) {
                this.disconnect(this.mouseoverArray[i].handle);
            }

            this.setMouseOver(count-1);

            // store the fact that the user has voted
            currentUserName = mx.session.getUserName();
            xpathString = "//" + this.pathName[1] + "[" + this.pathName[2] + " = '" + currentUserName + "']"+"["+ this.pathName[0] + " = '" + mxApp.getGUID() +  "']";

            mx.data.get({
                xpath    : xpathString,
                callback : lang.hitch(this, this.commitRating, count, mxApp)
            });
        },

        commitRating : function (count, mxApp, mxVote) {
            console.log(this.id + ".commitRating");

            var currentTotal, currentCount, userVote, voteDiff;

            currentTotal = mxApp.getAttribute(this.ratingsTotal);
            currentCount = mxApp.getAttribute(this.ratingsCount);

            if (mxVote.length === 0) { //user has not voted before
                this.createVote(mx.session.getUserName(), count, mxApp, currentTotal, currentCount);
            } else { //user has voted before, update the vote
                userVote = mxVote[0].getAttribute(this.pathAttr[2]);
                voteDiff = count - userVote;

                mxVote[0].setAttribute(this.pathAttr[2], count);
                mxVote[0].saveSequence();

                mxApp.setAttribute(this.ratingsTotal, (parseInt(currentTotal, 10) + voteDiff));
                mxApp.saveSequence();
            }
        },

        createVote : function (user, vote, app, currentTotal, currentCount) {
            console.log(this.id + ".createVote");

            mx.processor.createObject({
                "className"	: this.pathName[1],
                "callback"	: lang.hitch(this,

                                         function (user, vote, app, currentTotal, currentCount, voteObject) {
                    console.log(this.id + ".setVote");

                    app.addReference(this.pathName[0], voteObject.getGUID());
                    voteObject.setAttribute(this.pathName[2], user);
                    voteObject.setAttribute(this.pathAttr[2], vote);

                    app.setAttribute(this.ratingsTotal, (parseInt(currentTotal, 10) + vote));
                    app.setAttribute(this.ratingsCount, (parseInt(currentCount, 10) + 1));

                    app.saveSequence();
                    voteObject.saveSequence();
                },
                                         user,
                                         vote,
                                         app,
                                         currentTotal,
                                         currentCount
                                        ),
                "context"	: null
            });
        },

        mouseenterEvent : function(enterIterator, event) {
            console.log(this.id + ".mouseenterEvent");

            this.setMouseOver(enterIterator-1);
        },

        mouseleaveEvent : function(showVote, event) {
            console.log(this.id + ".mouseleaveEvent");

            this.setMouseOver(showVote-1);
        },

        applyContext : function(context, callback){
            console.log(this.id + ".applyContext");
            if (context) {
                mx.data.get({
                    guid: context.getActiveGUID(), 
                    callback: lang.hitch(this, this.showRatings)
                });
            } else {
                console.warm(this.id + ".applyContext received empty context");
            }
            callback();
        },

        uninitialize : function(){
            var i;
            console.log(this.id + ".uninitialize");
            dojoArray.forEach(this.connectArray, this.disconnect);
            for (i = 0; i < this.mouseoverArray.length; i++) {
                this.disconnect(this.mouseoverArray[i].handle);
            }
        }
    });
});
require(["Ratings/widget/ratings"], function () {
    "use strict";
});