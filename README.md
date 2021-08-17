# WFGiveawayBot
A 2nd rewrite of the giveaway bot intended for WFG, this is probably not gonna be used.


REMINDER: if you're going to host this bot, few things you need to do:
* Go to utilities/index.js and change the IDs to match what you need (guild.main, log.disqualify, role.giveaway)
* Go to event/discord/ready.js and uncomment return; at L54 so it will add all application commands to the guild.
  * Note this will require application commands to be authorised before using
* Replace the placeholder in example.env and fill in the information you need
  * BOT_TOKEN is for discord bot, you will have to create your own bot and use its token
  * For MongoDB, you will need to create an account, create a cluster, create a collection named 'sus' for some reason, then create collections 'Giveaways' and 'binding_user'

Things it can do:
* Use application commands (all slash, text and user)
  * Create/end/reroll a giveaway.
  * Count user's donated platinum.
  * Disqualify a user for 1 week.
* Giveaways
  * Reroll (not tested)
    * Keeps track on who already won (and qualified at the end of the giveaway)
  * Restrictions (role is not tested)
* Disqualification
  * Disqualify a user
    * Practically unlimited duration that I cba imposing a limit on
    * The bot won't add the role for disqualified
* If there's more, I forgot...

Things to add (TODO):
* Giveaways*
  * - [x] Support roles restriction
  * - [ ] Add a limit to how many giveaways a channel can have, and how many a guild can have (prob unlimited).
  * - [x] Add a command that will let mods bind users.
    * - [x] 
    * - [x] 
    * If a person loses access to their main account, the platinum donated can be bound without affecting the spreadsheet
  * - [ ] Change timer if already set, this might be controversial so this is the least priority.
* Infraction*
  * - [ ] Allow a user to see THEIR OWN history of infractions, provided if the guild allows it.
  * - [ ] Allow a mod to see history of infractions concerning a user.
    * - [ ] Send a file with the entire history if used in ![the right channel](https://i.imgur.com/wBjmBZd.png)
* Add a collection for servers
  * - [ ] Command Prefix.
  * - [ ] Allow server admins adding roles to whitelist, granting them access to use the main features of the bot for the guild.
    * Note this is currently hardcoded.
  * - [ ] Allow which commands can be used in specific channels.
  * - [ ] Toggle if all interactions can be made ephemeral (which they are anyways) so they won't disrupt the chat for others.
* - [ ] Add an alternative to database (currently mongodb is used, hence why a lot of managers are used)
* - [ ] Add (content) commands (literally there is none)
  * - [ ] Add support for creating giveaways so it will use typical g!start style and the code should interpret it into its own style
  * - [ ] Disqualify, blacklist (from using all of the commands)