import express from 'express';
import bodyParser from 'body-parser';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import mongoose from 'mongoose';
import Event from './models/events.js';
import User from './models/user.js';
import bcrypt from 'bcryptjs';

const app = express();
const port = 4000;

app.use(bodyParser.json());

app.use('/graphql', graphqlHTTP({
 schema: buildSchema(`
  type Event {
    _id: ID!
    title: String!
    description: String!
    price: Float!
    date: String!
    creator: User!
  }

  type User {
    _id: ID!
    email: String!
    password: String!
    createdEvents: [Event!]
  }

  input EventInput {
    title: String!
    description: String!
    price: Float!
    date: String!
  }


  input UserInput {
    email: String!
    password: String!
  }

  type RootQuery {
    events: [Event!]!
    users: [User!]!
  }

  type RootMutation {
    createEvent(eventInput: EventInput!): Event
    createUser(userInput: UserInput!): User
  }

  schema {
    query: RootQuery
    mutation: RootMutation
  }
 `),
 rootValue: {
   events: async () => {
    try {
       const events = await Event.find().populate('creator');
       return events.map(event => {
         return { ...event._doc, ...event._doc.creator._doc };
       });
     } catch (err) {
       return console.log('err', err);
     }
   },
   createEvent: async (args) => {
     try {
         const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: +args.eventInput.price,
          date: args.eventInput.date,
          creator: '6215044f95afac08ade751d5'
        });
        const newEvent = await event.save();
        const user = await User.findById('6215044f95afac08ade751d5');
        if(!user) {
          throw new Error('User not found.');
        }
        const savedUser = user.createdEvents.push(event);
        return {...newEvent._doc };
        
     } catch (err) {
        console.log(err);
        throw err
  }
},
createUser: async (args) => {
  try {
    const userExist = await User.findOne({email: args.userInput.email});
    if(userExist) {
      throw new Error("User already exist");
    }
    const hashPassword = await bcrypt.hash(args.userInput.password, 12)
      const user = new User({
      email: args.userInput.email,
      password: hashPassword
    });
    const newUser = await user.save();
    return {...newUser._doc};
    
  } catch (err) {
    console.log(err);
    throw err
    }
  }
 },
 graphiql: true 
}));

// mongoose.connect(`mongodb+srv://admin:admin123@cluster0.us3px.mongodb.net/event-react-dev?retryWrites=true&w=majority`)

mongoose.connect(`mongodb://127.0.0.1/event-booking`)
.then(() => app.listen(port, () =>  console.log(`Server started at port ${port}`))).catch(err => console.log(err));

