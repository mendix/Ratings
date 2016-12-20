# Ratings widget

This widget lets users rate an object from 1 to 5. It has a boolean to set it to enable voting or to be read-only. It comes in 2 flavours, in order to register the votes precisely where you want them. It tracks who has voted based on the  System.User name, so everyone can vote only once. After that they are just changing their vote.

Every version comes with the option to turn the voting on or off. In either case it will display the current average rating standard. Each one also lets you select the images you want to use to display your rating. There is one standard one and one for the mouse-over and showing the rating. These can be any icon in your project. The Rating widget can only be used in a Dataview or a Templategrid, as it needs a context object to work. For this widget we will assume you store your votes on a separate object, more on this in the configuration section.

- The standard Rating widget has most of the basic properties. Most important one for this version is the 'Auto commit' property. This is a boolean that determines if the widget should commit the object that was voted on. Turn this to 'true' if you are using the widget in a read-only form, so the object is commit with the new ratings when it is voted on. Set it to 'false' if the widget is in an editable form, as the save button should correctly handle any further committing of the object. The Vote object, which is used to track who voted already and what, always commits through the widget already.


- The Ratings widget (No registering) is a special version. Where the other two versions do all their processing in the widget, this version relies on your model to process the data. It has the same front-end as the others but it doesn't calculate or store anything, it only changes an attribute to 1-5 based on the vote. Any calculating of averages can then be done in a before-commit microflow on the same object.

###Typical usage scenario
Tracking how popular your [insert your entity here] are!

###Limitations
- Can only vote from 1 to 5
- No support for 0.5 ratings.
- Note that voting will commit the context object.

###Configuration
In order to start using the Ratings widget, you need to make some changes in your Domain Model. You can name any of these attributes/entities as you like, just make sure you set them correctly on the widget.
- Add 2 attributes to the entity you would like people to vote on: RatingsTotal  (Integer) and RatingsCount (Integer).
- Create a Vote entity with 2 attributes: VoteName (String) and VoteAmount (Integer).
- Link the Vote entity to your entity using a N - 0 relation, starting at the context entity. See the screenshot for an example domain model.
- Make sure you set your delete behaviour.

You can now insert the Ratings widget in to your Dataview or Templategrid. Make sure you use the correct version, the differences can be found in the Description section above. Make sure you fill in all the required properties and you are good to go! In the Properties section below you will find how all the different properties work.

###Properties
- Unstarred image - Image, the image used for the unstarred part.
- Starred image - Image, the image used for the starred part.
- Voting enabled - Boolean, is it show rating only or can people vote using it.
- Ratings total - Integer, the attribute where the total of all the votes will be stored.
- Ratings count - Integer, the attribute where the total count of all votes will be stored.
- Vote username - String, the attribute of the associated Vote entity that stores the username.
- Vote attribute - Integer, the attribute of the associated Vote entity that stores the vote amount .

## Contributing

For more information on contributing to this repository visit [Contributing to a GitHub repository](https://world.mendix.com/display/howto50/Contributing+to+a+GitHub+repository)!
