//This having some throw err and ENOT found error (either fix it or don't use it)
const bcrypt = require('bcryptjs');

const Event = require("../../models/event");
const User = require("../../models/user");
const Booking = require('../../models/booking');

const transformEvent = oneEvent => {
    return {
        ...oneEvent._doc, 
        _id: oneEvent.id, 
        date: new Date(oneEvent._doc.date).toISOString(), 
        creator: user.bind(this, oneEvent.creator)
    };
};

const events = async eventIds => {
    try {
        const events = await Event.find({_id: {$in: eventIds}});
        events.map(event => {
            return transformEvent(event);
        });
        return events;
    } catch(err) {
        throw err;
    }
};

const singleEvent = async eventId => {
    try{
        const event = await Event.findById(eventId);
        return transformEvent(event);
    } catch(err) {
        throw err;
    }
}

const user = userId => {
    return User.findById(userId)
        .then(user => {
            return {
                ...user._doc, 
                _id: user.id, 
                createdEvents: events.bind(this, user._doc.createdEvents)
            }
        })
        .catch(err => {
            throw err;
        })
};

module.exports = {
    events: () => {
        return Event
            .find()
            .then(events => {
                return events.map(event => {
                    return transformEvent(event);
                });
            })
            .catch(err => {
                throw err;
            });
    },
    bookings: async () => {
        try {
            const bookings = await Booking.find();
            return bookings.map(booking => {
                return { 
                    ...booking._doc, 
                    _id: booking.id,
                    user: user.bind(this, booking._doc.user),
                    event: singleEvent.bind(this, booking._doc.event), 
                    createdAt: new Date(booking._doc.createdAt).toISOString(), 
                    updatedAt: new Date(booking._doc.updatedAt).toISOString()
                };
            });
        } catch (err) {
            throw err;
        }
    },
    createEvent: (args) => {
        //const event = {
        //    _id: Math.random().toString(),
        //    title: args.eventInput.title,
        //    description: args.eventInput.description,
        //    price: +args.eventInput.price,
        //    date: args.eventInput.date
        //}
        const event = new Event({
            title: args.eventInput.title,
            description: args.eventInput.description,
            price: +args.eventInput.price,
            date: new Date(args.eventInput.date),
            creator: '5eb5c162c19026298d306575'
        });
        let createdEvent;
        return event
            .save()
            .then(result => {
                createdEvent = transformEvent(result);
                return User.findById('5eb5c162c19026298d306575')
            })
            .then(user => {
                if(!user){
                    throw new Error('User does not exist!');
                }
                user.createdEvents.push(event);
                return user.save();
            })
            .then(result => {
                return createdEvent;
            })
            .catch(err => {
                console.log(err);
                throw err;
            });
    },
    createUser: (args) => {
        return User.findOne({email: args.userInput.email})
            .then(user => {
                if(user) {
                    throw new Error('User already exists');
                }
                return bcrypt.hash(args.userInput.password, 12);
            })
            .then(hashedPassword => {
                const user = new User({
                    email: args.userInput.email,
                    password: hashedPassword
                });
                return user.save();
            })
            .then(result => {
                return {...result._doc, password: null, _id: result.id};
            })
            .catch(err => {
                throw err;
            });
    },
    bookEvent: async args => {
        const fetchedEvent = await Event.findOne({_id: args.eventId})
        const booking = new Booking({
            user: '5eb5c162c19026298d306575',
            event: fetchedEvent
        });
        const result = await booking.save();
        return {
            ...result._doc, 
            _id: result.id,
            user: user.bind(this, booking._doc.user),
            event: singleEvent.bind(this, booking._doc.event), 
            createdAt: new Date(result._doc.createdAt).toISOString(), 
            updatedAt: new Date(result._doc.updatedAt).toISOString()
        };
    },
    cancelBooking: async args => {
        try {
            const booking = await Booking.findById(args.bookingId).populate('event');
            const event = transformEvent(booking.event);
            await Booking.deleteOne({_id: args.bookingId});
            return event; 
        }catch(err){
            throw err;
        }
    } 
}
