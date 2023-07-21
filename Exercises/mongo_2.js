const mongoose = require('mongoose')
const password = process.argv[2]
const person_name = process.argv[3]
const person_number = process.argv[4]

const url =
  `mongodb+srv://modar:${password}@cluster0.ckgsaa3.mongodb.net/PhoneBook?retryWrites=true&w=majority`

mongoose.set('strictQuery',false)
mongoose.connect(url)

const personSchema = new mongoose.Schema({
  name: String,
  number: String,
})

const Person = mongoose.model('Person', personSchema)

const p = new Person({
  name: `${person_name}`,
  number: `${person_number}`,
})

if (process.argv.length <= 3) {
  Person.find({}).then((result) => {
    result.forEach((person) => {
      console.log(`${person.name} ${person.number}`)
    })
  }).finally(() => {
    mongoose.connection.close()
  })
} else {
  p.save().then(() =>
    console.log(`added ${person_name} number ${person_number} to phonebook`)
  ).finally(() => {
    mongoose.connection.close()
  })
}