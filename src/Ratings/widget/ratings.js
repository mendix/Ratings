define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/dom-attr",
    "dojo/dom-construct",
    "dojo/_base/lang",
    "dojo/number",
    "dojo/_base/array",
    "dojo/text!Ratings/widget/templates/ratings.html"
], function (declare, _WidgetBase, _TemplatedMixin, domAttr, domConstruct, lang, number, dojoArray, widgetTemplate) {
    "use strict";

    return declare("Ratings.widget.ratings", [ _WidgetBase, _TemplatedMixin ], {

        templateString : widgetTemplate,

        divNode : "",
        attrValues : null,
        hasVoted : true,
        connectArray : null,
        mouseoverArray : null,
        root : "",
        ratingsListEvent : "",
        pathAttr : "",
        pathName : "",

        standardImage: null,
        mouseoverImage: null,
        halfImage: "",

        _contextObj: null,

        postCreate : function(){
            logger.debug(this.id + ".postCreate");
            this.root = window.mx.appUrl;

            this.attrValues = [];
            this.connectArray = [];
            this.mouseoverArray = [];
            this.pathAttr = this.voteAttr.split("/");
            this.pathName = this.voteName.split("/");
        },

        showRatings : function(callback){
            logger.debug(this.id + ".showRatings");

            var mxApp = this._contextObj;

            /* CLEAR ALL NODES */
            domConstruct.empty(this.divNode);

            var showTotal = 0,
                showCount = 0,
                showVote = 0;

            //retrieve and calculate the vote values
            showTotal = parseInt(mxApp.get(this.ratingsTotal), 10);
            showCount = parseInt(mxApp.get(this.ratingsCount), 10);

            if (showCount === 0) {
                showVote = 1;
            } else if (this.halfImage !== "") {
                showVote = ((showTotal / showCount) * 2).toFixed() / 2;
            } else {
                showVote = number.round((showTotal / showCount));
            }

            var ratingsList = mxui.dom.create("ul");
            if (this.voteEnabled === true) {
                this.ratingsListEvent = this.connect(ratingsList, "onmouseleave", lang.hitch(this, this.mouseleaveEvent, showVote));
            }

            for (var i = 1; i <= 5; i++) {
                var imgNode = mxui.dom.create("img",{"class": "ratings_image"});
                if (i > showVote) {
                    if (this.halfImage !== "" && (i - showVote === 0.5)) {
                        domAttr.set(imgNode, "src", this._getImagePath(this.halfImage));
                    } else {
                        domAttr.set(imgNode, "src", this._getImagePath(this.standardImage));
                    }
                } else {
                    domAttr.set(imgNode, "src", this._getImagePath(this.mouseoverImage));
                }
                var ratingsLi = mxui.dom.create("li", imgNode);
                if (this.voteEnabled === true) {
                    this.mouseoverArray[i-1] = {};
                    this.mouseoverArray[i-1].handle = this.connect(imgNode, "onmouseenter", lang.hitch(this, this.mouseenterEvent, i));
                    this.mouseoverArray[i-1].element = imgNode;
                    this.connectArray[i-1] = this.connect(ratingsLi, "onclick", lang.hitch(this, this.onclickRating, i, mxApp));
                }
                ratingsList.appendChild(ratingsLi);
            }
            this.divNode.appendChild(ratingsList);

            mendix.lang.nullExec(callback);
        },

        setMouseOver : function (iterator) {
            logger.debug(this.id + ".setMouseOver", iterator);

            for (var j = 0; j <= iterator; j++) {
                this.mouseoverArray[j].element.src = this._getImagePath(this.mouseoverImage);
            }

            for (var k = 4; k > iterator; k--) {
                if (this.halfImage !== "" && (k - iterator === 0.5)) {
                    this.mouseoverArray[k].element.src = this._getImagePath(this.halfImage);
                } else {
                    this.mouseoverArray[k].element.src = this._getImagePath(this.standardImage);
                }
            }
        },

        _getImagePath : function (img) {
            return this.root + "/" + img;
        },

        onclickRating : function(count, mxApp, event) {
            logger.debug(this.id + ".onclickRating");

            // user can click only once
            this.disconnect(this.ratingsListEvent);
            for (var i = 0; i < this.mouseoverArray.length; i++) {
                this.disconnect(this.mouseoverArray[i].handle);
            }

            this.setMouseOver(count - 1);

            // store the fact that the user has voted
            var currentUserName = mx.session.getUserName();
            var xpathString = "//" + this.pathName[1] + "[" + this.pathName[2] + " = '" + currentUserName + "']"+"["+ this.pathName[0] + " = '" + mxApp.getGuid() +  "']";

            mx.data.get({
                xpath    : xpathString,
                callback : lang.hitch(this, this.commitRating, count, mxApp)
            });
        },

        commitRating : function (count, mxApp, mxVote) {
            logger.debug(this.id + ".commitRating");

            var currentTotal = mxApp.get(this.ratingsTotal),
                currentCount = mxApp.get(this.ratingsCount);

            if (mxVote.length === 0) { //user has not voted before
                this.createVote(mx.session.getUserName(), count, mxApp, currentTotal, currentCount);
            } else { //user has voted before, update the vote
                var userVote = mxVote[0].get(this.pathAttr[2]),
                    voteDiff = count - userVote;

                mxVote[0].set(this.pathAttr[2], count);
                this._saveSequence(mxVote[0]);

                mxApp.set(this.ratingsTotal, (parseInt(currentTotal, 10) + voteDiff));
                this._saveSequence(mxApp);
            }
        },

        createVote : function (user, vote, app, currentTotal, currentCount) {
            logger.debug(this.id + ".createVote");

            mx.data.create({
                "entity"	: this.pathName[1],
                "callback"	: lang.hitch(this,
                    function (user, vote, app, currentTotal, currentCount, voteObject) {
                        logger.debug(this.id + ".createVote created");

                        app.addReference(this.pathName[0], voteObject.getGuid());
                        voteObject.set(this.pathName[2], user);
                        voteObject.set(this.pathAttr[2], vote);

                        app.set(this.ratingsTotal, (parseInt(currentTotal, 10) + vote));
                        app.set(this.ratingsCount, (parseInt(currentCount, 10) + 1));

                        this._saveSequence(app);
                        this._saveSequence(voteObject);
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

        _saveSequence: function (obj) {
            logger.debug(this.id + "._saveSequence, type: " + obj.getEntity());
            mx.data.save({
                mxobj: obj,
                callback: lang.hitch(this, function () {
                    logger.debug(this.id + "._saveSequence obj type " + obj.getEntity() + " saved");
                    mx.data.commit({
                        mxobj: obj,
                        callback: lang.hitch(this, function () {
                            logger.debug(this.id + "._saveSequence obj type " + obj.getEntity() + " committed");
                        }),
                        error: lang.hitch(this, function (err) {
                            logger.error(this.id + "._saveSequence obj type " + obj.getEntity() + " commit error: ", err);
                        })
                    });
                }),
                error: lang.hitch(this, function (err) {
                    logger.error(this.id + "._saveSequence obj type " + obj.getEntity() + " save error: ", err);
                })
            });
        },

        mouseenterEvent : function(enterIterator, event) {
            logger.debug(this.id + ".mouseenterEvent");
            this.setMouseOver(enterIterator - 1);
        },

        mouseleaveEvent : function(showVote, event) {
            logger.debug(this.id + ".mouseleaveEvent", showVote);
            this.setMouseOver(showVote - 1);
        },

        update: function (obj, callback) {
            logger.debug(this.id + ".update");
            if (obj) {
                this._contextObj = obj;
                this.showRatings(callback);
            } else {
                console.warm(this.id + ".update received empty context");
                mendix.lang.nullExec(callback);
            }
        },

        uninitialize : function(){
            logger.debug(this.id + ".uninitialize");
            dojoArray.forEach(this.connectArray, this.disconnect);
            for (var i = 0; i < this.mouseoverArray.length; i++) {
                this.disconnect(this.mouseoverArray[i].handle);
            }
        }
    });
});

require(["Ratings/widget/ratings"]);
