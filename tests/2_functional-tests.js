/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *
 */

const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const url = '/api/books';

chai.use(chaiHttp);

suiteSetup((done) => {
  server.on('ready', () => {
    done();
  });
});

suite('Functional Tests', function () {
  /*
   * ----[EXAMPLE TEST]----
   * Each test should completely test the response of the API end-point including response status code!
   */
  // test('#example Test GET /api/books', function (done) {
  //   chai
  //     .request(server)
  //     .get(url)
  //     .end((err, res) => {
  //       assert.equal(res.status, 200);
  //       assert.isArray(res.body, 'response should be an array');
  //       res.body.forEach((book) => {
  //         assert.property(
  //           book,
  //           'commentcount',
  //           'Books in array should contain commentcount'
  //         );
  //         assert.property(book, 'title', 'Books in array should contain title');
  //         assert.property(book, '_id', 'Books in array should contain _id');
  //       });
  //       done();
  //     });
  // });
  /*
   * ----[END of EXAMPLE TEST]----
   */

  suite('Routing tests', function () {
    suite(
      'POST /api/books with title => create book object/expect book object',
      function () {
        test('Test POST /api/books with title', (done) => {
          chai
            .request(server)
            .post(url)
            .send({ title: 'Mocha and Chai test 2' })
            .end((err, res) => {
              assert.equal(res.status, 200);
              assert.isObject(res.body);
              assert.property(res.body, 'title');
              assert.property(res.body, '_id');
              assert.property(res.body, 'comments');
              assert.equal(res.body.title, 'Mocha and Chai test 2');
              assert.isArray(res.body.comments);
              done();
            });
        });

        test('Test POST /api/books with title already in db', (done) => {
          chai
            .request(server)
            .post(url)
            .send({ title: 'Mocha and Chai test' })
            .end((err, res) => {
              assert.equal(res.status, 400);
              assert.equal(res.text, 'title already exists');
              done();
            });
        });

        test('Test POST /api/books with no title given', function (done) {
          chai
            .request(server)
            .post(url)
            .send({ title: '' })
            .end((err, res) => {
              assert.equal(res.status, 400);
              assert.equal(res.text, 'missing title');
              done();
            });
        });
      }
    );

    suite('GET /api/books => array of books', function () {
      test('Test GET /api/books', function (done) {
        chai
          .request(server)
          .get(url)
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            res.body.forEach((book) => {
              assert.property(book, 'commentcount');
              assert.property(book, 'title');
              assert.property(book, '_id');
            });
            done();
          });
      });
    });

    suite('GET /api/books/[id] => book object with [id]', function () {
      test('Test GET /api/books/[id] with id not in db', function (done) {
        chai
          .request(server)
          .get(`${url}/5ef744bf76ad65006d7be59d`)
          .end((err, res) => {
            assert.equal(res.status, 400);
            assert.equal(res.text, 'no book exists');
            done();
          });
      });

      test('Test GET /api/books/[id] with valid id in db', function (done) {
        const id = '5efc691128e171462eee05e8';
        chai
          .request(server)
          .get(`${url}/${id}`)
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.property(res.body, '_id');
            assert.property(res.body, 'title');
            assert.property(res.body, 'comments');
            assert.equal(res.body._id, id);
            assert.isArray(res.body.comments);
            done();
          });
      });
    });

    suite(
      'POST /api/books/[id] => add comment/expect book object with id',
      function () {
        test('Test POST /api/books/[id] with comment', function (done) {
          const id = '5efc691128e171462eee05e8';
          chai
            .request(server)
            .post(`${url}/${id}`)
            .send({ comment: 'Mocha and Chai test: add comment' })
            .end((err, res) => {
              assert.equal(res.status, 200);
              assert.isObject(res.body);
              assert.property(res.body, '_id');
              assert.property(res.body, 'title');
              assert.property(res.body, 'comments');
              assert.equal(res.body._id, id);
              assert.isArray(res.body.comments);
              assert.include(
                res.body.comments,
                'Mocha and Chai test: add comment'
              );
              done();
            });
        });

        test('Test POST /api/books/[id] with id not in db', (done) => {
          chai
            .request(server)
            .post(`${url}/5ef744bf76ad65006d7be59d`)
            .send({ comment: 'POST: no book exists' })
            .end((err, res) => {
              assert.equal(res.status, 400);
              assert.equal(res.text, 'no book exists');
              done();
            });
        });

        test('Test POST /api/books/[id] with missing comment', (done) => {
          const id = '5efc691128e171462eee05e8';
          chai
            .request(server)
            .post(`${url}/${id}`)
            .send({ comment: '' })
            .end((err, res) => {
              assert.equal(res.status, 400);
              assert.equal(res.text, 'missing comments');
              done();
            });
        });
      }
    );
  });
});
