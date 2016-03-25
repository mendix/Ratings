/*jslint white:true, nomen: true, plusplus: true */
/*global mx, define, require, browser, devel, console, document, jQuery, ga, window, mxui, location */

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
                logger.debug(this.id + ".postCreate");
                this.root = window.mx.appUrl;

                this.attrValues = [];
                this.connectArray = [];
                this.mouseoverArray = [];
                this.pathAttr = this.voteAttr.split("/");
                this.pathName = this.voteName.split("/");
            },

            showRatings : function(mxApp){
                logger.debug(this.id + ".showRatings");

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
                showTotal = mxApp.get(this.ratingsTotal);
                showCount = mxApp.get(this.ratingsCount);
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
                logger.debug(this.id + ".setMouseOver");

                var j,k;

                for (j = 0; j <= iterator; j++) {
                    this.mouseoverArray[j].element.src = this.root + "/" + this.mouseoverImage;
                }

                for (k = 4; k > iterator; k--) {
                    this.mouseoverArray[k].element.src = this.root + "/" + this.standardImage;
                }

            },

            onclickRating : function(count, mxApp, event) {
                logger.debug(this.id + ".onclickRating");

                var i, currentUserName, xpathString;

                // user can click only once
                this.disconnect(this.ratingsListEvent);
                for (i = 0; i < this.mouseoverArray.length; i++) {
                    this.disconnect(this.mouseoverArray[i].handle);
                }

                this.setMouseOver(count-1);

                // store the fact that the user has voted
                currentUserName = mx.session.getUserName();
                xpathString = "//" + this.pathName[1] + "[" + this.pathName[2] + " = '" + currentUserName + "']"+"["+ this.pathName[0] + " = '" + mxApp.getGuid() +  "']";

                mx.data.get({
                    xpath    : xpathString,
                    callback : lang.hitch(this, this.commitRating, count, mxApp)
                });
            },

            commitRating : function (count, mxApp, mxVote) {
                logger.debug(this.id + ".commitRating");

                var currentTotal, currentCount, userVote, voteDiff;

                currentTotal = mxApp.get(this.ratingsTotal);
                currentCount = mxApp.get(this.ratingsCount);

                if (mxVote.length === 0) { //user has not voted before
                    this.createVote(mx.session.getUserName(), count, mxApp, currentTotal, currentCount);
                } else { //user has voted before, update the vote
                    userVote = mxVote[0].get(this.pathAttr[2]);
                    voteDiff = count - userVote;

                    mxVote[0].get(this.pathAttr[2], count);
                    mxVote[0].saveSequence();

                    mxApp.set(this.ratingsTotal, (parseInt(currentTotal, 10) + voteDiff));
                    mxApp.saveSequence();
                }
            },

            createVote : function (user, vote, app, currentTotal, currentCount) {
                logger.debug(this.id + ".createVote");

                mx.data.create({
                    "entity"	: this.pathName[1],
                    "callback"	: lang.hitch(this,
                        function (user, vote, app, currentTotal, currentCount, voteObject) {
                            console.log(this.id + ".setVote");

                            app.addReference(this.pathName[0], voteObject.getGuid());
                            voteObject.set(this.pathName[2], user);
                            voteObject.set(this.pathAttr[2], vote);

                            app.set(this.ratingsTotal, (parseInt(currentTotal, 10) + vote));
                            app.set(this.ratingsCount, (parseInt(currentCount, 10) + 1));

                            this._safeSequence(app);
                            this._safeSequence(voteObject);
                            //app.saveSequence();
                            //voteObject.saveSequence();
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

            _safeSequence: function (obj) {
                logger.debug(this.id + "._safeSequence");
                mx.data.save({
                    mxobj: obj,
                    callback: lang.hitch(this, function () {
                        logger.debug(this.id + "._safeSequence obj saved");
                        mx.data.commit({
                            mxobj: obj,
                            callback: lang.hitch(this, function  () {
                                logger.debug(this.id + "._safeSequence obj commit");
                            })
                        });
                    })
                });
            },


            mouseenterEvent : function(enterIterator, event) {
                logger.debug(this.id + ".mouseenterEvent");

                this.setMouseOver(enterIterator-1);
            },

            mouseleaveEvent : function(showVote, event) {
                logger.debug(this.id + ".mouseleaveEvent");

                this.setMouseOver(showVote-1);
            },

            applyContext : function(context, callback){
                logger.debug(this.id + ".applyContext", context);
                if (context) {
                    mx.data.get({
                        guid: context.getTrackId(),
                        callback: lang.hitch(this, this.showRatings)
                    });
                } else {
                    console.warm(this.id + ".applyContext received empty context");
                }
                callback();
            },

            uninitialize : function(){
                logger.debug(this.id + ".uninitialize");
                var i;
                dojoArray.forEach(this.connectArray, this.disconnect);
                for (i = 0; i < this.mouseoverArray.length; i++) {
                    this.disconnect(this.mouseoverArray[i].handle);
                }
            }
        });
    });

require(["Ratings/widget/ratings"]);
