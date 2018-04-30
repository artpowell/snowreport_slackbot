/*

    This is a sample bot that provides a simple todo list function
    and demonstrates the Botkit storage system.

    Botkit comes with a generic storage system that can be used to
    store arbitrary information about a user or channel. Storage
    can be backed by a built in JSON file system, or one of many
    popular database systems.

    See:

        botkit-storage-mongo
        botkit-storage-firebase
        botkit-storage-redis
        botkit-storage-dynamodb
        botkit-storage-mysql

*/

module.exports = function(controller) {

    // listen for someone saying 'tasks' to the bot
    // reply with a list of current tasks loaded from the storage system
    // based on this user's id
    controller.hears(['favorites','myresorts'], 'direct_message', function(bot, message) {

        // load user from storage...
        controller.storage.users.get(message.user, function(err, user) {

            // user object can contain arbitary keys. we will store tasks in .tasks
            if (!user || !user.resorts || user.resorts.length == 0) {
                bot.reply(message, 'There are no resorts on your favorite resort list. Say `add _resort_` to add something.');
            } else {

                var text = 'Here are your current favorite resorts: \n' +
                    generateFavoriteResortList(user);
                    //'Reply with `remove _number_` to mark a task completed.';

                bot.reply(message, text);

            }

        });

    });

    // listen for a user saying "add <something>", and then add it to the user's list
    // store the new list in the storage system
    controller.hears(['add (.*)'],'direct_message,direct_mention,mention', function(bot, message) {

        var newresort = message.match[1];
        console.log('value of newresort:' + newresort);
        controller.storage.users.get(message.user, function(err, user) {

            if (!user) {
                user = {};
                user.id = message.user;
                user.tasks = [];
                user.resorts = [];
            }

            //user.resorts.add(newresort);
            user.resorts.push(newresort);

            controller.storage.users.save(user, function(err,saved) {

                if (err) {
                    bot.reply(message, 'I experienced an error adding your resort: ' + err);
                } else {
                    bot.api.reactions.add({
                        name: 'thumbsup',
                        channel: message.channel,
                        timestamp: message.ts
                    });
                }

            });
        });

    });

    // listen for a user saying "remove <number>" and mark that item as removed.
    controller.hears(['remove (.*)'],'direct_message', function(bot, message) {

        var number = message.match[1];

        if (isNaN(number)) {
            bot.reply(message, 'Please specify a number.');
        } else {

            // adjust for 0-based array index
            number = parseInt(number) - 1;

            controller.storage.users.get(message.user, function(err, user) {

                if (!user) {
                    user = {};
                    user.id = message.user;
                    user.tasks = [];
                    user.resorts = [];
                }

                if (number < 0 || number >= user.resorts.length) {
                    bot.reply(message, 'Sorry, your input is out of range. Right now there are ' + user.resorts.length + ' items on your list.');
                } else {

                    var resort = user.resorts.splice(number,1);
                    delete user.resorts[resort];

                    // save the deletion to the file storage system
                    // NEED TO CONTRIBUTE THIS CHANGE
                    controller.storage.users.save(user, function(err,saved) {

                        if (err) {
                            bot.reply(message, 'I experienced an error removing your resort: ' + err);
                        } else {
                            bot.api.reactions.add({
                                name: 'point_left',
                                channel: message.channel,
                                timestamp: message.ts
                            });
                        }
                    });

                    // reply with a strikethrough message...
                    bot.reply(message, '~' + resort + '~');

                    if (user.resorts.length > 0) {
                        bot.reply(message, 'Here are your remaining resorts:\n' + generateFavoriteResortList(user));
                    } else {
                        bot.reply(message, 'Your list is now empty!');
                    }
                }
            });
        }

    });

    // simple function to generate the text of the task list so that
    // it can be used in various places
    function generateFavoriteResortList(user) {

        var text = '';

        for (var t = 0; t < user.resorts.length; t++) {
            text = text + '> `' +  (t + 1) + '`) ' +  user.resorts[t] + '\n';
        }

        return text;

    }
}
