const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')
const mongoose = require('mongoose')
require('dotenv').config()

const Person = require('./models/person')

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}


const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError')
  {
    return response.status(400).json({ error: error.message
    })
  }

  next(error)
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(cors())
app.use(express.json())
app.use(requestLogger)
app.use(express.static('build'))

let isMongooseConnected = false

const connectToDatabase = () => {
  if (!isMongooseConnected) {
    mongoose.set('strictQuery', false)
    const url = process.env.MONGODB_URI
    mongoose.connect(url)
    isMongooseConnected = true
  }
}

morgan.token('body', (req) => JSON.stringify(req.body))
app.use(morgan(':method :url :status :response-time ms - :body'))


app.get('/api/persons', (request, response) => {
  Person.find({}).then(notes => {
    response.json(notes)
  })
})

app.get('/info', (request, response) => {
  Person.countDocuments({})
    .then(count => {
      const today = new Date()
      const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'long'
      }
      const formattedDateTime = today.toLocaleString('en-US', options)
      console.log(formattedDateTime)

      response.send(`
            <div>
                <p>Phonebook has info for ${count} people</p><br/>
                <p>${formattedDateTime}</p>
            </div>
        `)
    })

})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then(person => {
      if (person) {
        response.json(person)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
  const body = request.body

  if (!body.name || !body.number) {
    return response.status(400).json({
      error: 'Name or number missing'
    })
  }

  Person.findOne({ name: body.name })
    .then(existingPerson => {
      if (existingPerson) {
        return response.status(400).json({ error: 'Name must be unique' })
      }

      const person = new Person({
        name: body.name,
        number: body.number,
      })

      const start = Date.now()
      const end = Date.now()
      const responseTime = end - start

      response.setHeader('X-Response-Time', `${responseTime}ms`)

      person.save().then(savedPerson => {
        response.json(savedPerson)
      }).catch(error => next(error))
    })

})


app.put('/api/persons/:id', (request, response, next) => {
  const { name, number } = request.body



  Person.findByIdAndUpdate(request.params.id,
    { name },
    { new: true , runValidators: true, context: 'query' })
    .then(updatedName => {
      response.json(updatedName)
    })
    .catch(error => next(error))
})


app.use(unknownEndpoint)
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})