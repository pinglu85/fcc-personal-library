/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

'use strict';

const ObjectId = require('mongodb').ObjectId;
const writeConcern = {
  writeConcern: {
    w: 'majority',
    j: true,
    wtimeout: 1000,
  },
};

module.exports = function (app, db) {
  app
    .route('/api/books')
    .get((req, res, next) => {
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      db.collection('books')
        .aggregate([
          {
            $project: {
              _id: 1,
              title: 1,
              commentcount: {
                $cond: {
                  if: { $isArray: '$comments' },
                  then: { $size: '$comments' },
                  else: 'NA',
                },
              },
            },
          },
        ])
        .toArray()
        .then((result) => {
          res.json(result);
        })
        .catch((err) => {
          next({ status: 500, message: err });
        });
    })

    .post(async (req, res, next) => {
      const title = req.body.title;
      if (!title) {
        return next({ status: 400, message: 'missing title' });
      }

      const encodedTitle = title.replace(
        /[<>]/g,
        (match) =>
          ({
            '<': '&lt;',
            '>': '&gt;',
          }[match])
      );
      //response will contain new book object including atleast _id and title
      const book = await db
        .collection('books')
        .findOne({ title: encodedTitle });
      if (book) {
        return next({ status: 400, message: 'title already exists' });
      } else {
        db.collection('books')
          .insertOne(
            { _id: ObjectId(), title: encodedTitle, comments: [] },
            writeConcern
          )
          .then((result) => {
            const book = result.ops[0];
            res.json({
              title: book.title,
              comments: [...book.comments],
              _id: book._id,
            });
          })
          .catch((err) => {
            next({ status: 500, message: err });
          });
      }
    })

    .delete(function (req, res, next) {
      //if successful response will be 'complete delete successful'
      db.collection('books')
        .deleteMany({}, writeConcern)
        .then((result) => {
          const { deletedCount } = result;
          if (deletedCount) {
            res.type('text').send('complete delete successful');
          } else {
            throw new Error('no books to delete');
          }
        })
        .catch((err) => {
          next({ status: 400, message: err.message });
        });
    });

  app
    .route('/api/books/:id')
    .get((req, res, next) => {
      const bookId = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      db.collection('books')
        .findOne({ _id: ObjectId(bookId) })
        .then((result) => {
          if (result) {
            res.json(result);
          } else {
            throw new Error('no book exists');
          }
        })
        .catch((err) => {
          next({ status: 400, message: err.message || err });
        });
    })

    .post((req, res, next) => {
      const bookId = req.params.id;
      const comment = req.body.comment;
      if (!comment) {
        return next({
          status: 400,
          message: 'missing comments',
        });
      }

      const encodedComment = comment.replace(
        /[<>]/g,
        (match) =>
          ({
            '<': '&lt;',
            '>': '&gt;',
          }[match])
      );

      const update = {
        $push: {
          comments: encodedComment,
        },
      };

      db.collection('books')
        .findOneAndUpdate({ _id: ObjectId(bookId) }, update, {
          // Return the updated document instead of the original document
          returnOriginal: false,
          ...writeConcern,
        })
        .then((result) => {
          const updatedBook = result.value;
          if (updatedBook) {
            res.json(updatedBook);
          } else {
            throw new Error('no book exists');
          }
        })
        .catch((err) => {
          next({
            status: 400,
            message: err.message || err,
          });
        });
    })

    .delete((req, res, next) => {
      const bookId = req.params.id;
      //if successful response will be 'delete successful'
      db.collection('books')
        .deleteOne({ _id: ObjectId(bookId) }, writeConcern)
        .then((result) => {
          const { deletedCount } = result;
          if (deletedCount) {
            res.type('text').send('delete successful');
          } else {
            throw new Error(`could not delete ${bookId}`);
          }
        })
        .catch((err) => {
          next({ status: 400, err: err.message || err });
        });
    });
};
