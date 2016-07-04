import { Meteor } from 'meteor/meteor';
import query from 'pg-query';

query.connectionParameters = "postgres://ben:0rangepumpkint0es@localhost:5432/fp";
Meteor.startup(() => {
  // code to run on server at startup
  query('SELECT $1::int AS number', ['1'], function(err, rows, result) {

    if(err) {
      return console.error('error running query', err);
    }
    console.log(result.rows[0].number);
    //output: 1
  });
/*
  var client = new pg.Client(conString);
  client.connect(function(err) {
    if(err) {
      return console.error('could not connect to postgres', err);
    }
    client.query('SELECT NOW() AS "theTime"', function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
      console.log(result.rows[0].theTime);
      //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
      client.end();
    });
  });

  client.connect(function(err) {
    if(err) {
      return console.error('could not connect to postgres', err);
    }
    client.query('SELECT NOW() AS "theTime"', function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
      console.log(result.rows[0].theTime);
      //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
      client.end();
    });
  });
*/
});
