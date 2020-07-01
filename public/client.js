const url = '/api/books';
const listDisplay = document.getElementById('display');
const listWrapper = document.getElementById('listWrapper');
const bookDetail = document.getElementById('bookDetail');
const detailTitle = document.getElementById('detailTitle');
const detailComments = document.getElementById('detailComments');
const newCommentForm = document.getElementById('newCommentForm');
const commentToAdd = document.getElementById('commentToAdd');
const addCommentBtn = newCommentForm.querySelector('.addComment');
const deleteBookBtn = newCommentForm.querySelector('.deleteBook');

// Fetch all books from db when page load
fetch(url)
  .then((response) => response.json())
  .then((data) => {
    let dataLength = data.length;

    // If there are more than 15 books in db, show only first 15
    if (data.length > 15) {
      const p = document.createElement('p');
      p.style.textIndent = '24px';
      p.textContent = `...and ${data.length - 15} more!`;
      listDisplay.appendChild(p);
      dataLength = 15;
    }

    for (let i = 0; i < dataLength; i++) {
      const title = data[i].title;
      const id = data[i]._id;
      const li = document.createElement('li');
      li.className = 'bookItem';
      li.setAttribute('id', id);
      li.textContent = `${title} - ${data[i].commentcount} comments`;
      li.addEventListener('click', showBookDetail.bind(this, title, id));
      listWrapper.appendChild(li);
    }
  })
  .catch((err) => {
    console.log(err);
  });

// Show book detail
function showBookDetail(title, id) {
  detailTitle.innerHTML = `<b>${title}</b> (${id})`;

  // Remove previous Book's comments from the DOM
  while (detailComments.firstChild) {
    detailComments.removeChild(detailComments.firstChild);
  }
  // Set list style back to decimal
  detailComments.style.listStyle = 'decimal';

  // Show new comment form
  newCommentForm.style.display = 'block';
  newCommentForm.addEventListener('submit', preventFormSubmit);
  addCommentBtn.setAttribute('id', id);
  addCommentBtn.addEventListener('click', addCommentHandler);
  deleteBookBtn.setAttribute('id', id);
  deleteBookBtn.addEventListener('click', deleteBookHandler);

  // Fetch comments of the selected book from server and display them
  fetch(`${url}/${id}`)
    .then((response) => response.json())
    .then((data) => {
      const comments = data.comments;
      if (comments.length) {
        comments.forEach((comment) => {
          const li = document.createElement('li');
          li.textContent = comment;
          detailComments.appendChild(li);
        });
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

// Prevent form submit
function preventFormSubmit(e) {
  e.preventDefault();
}

// Add new comment to current book
function addCommentHandler() {
  const id = addCommentBtn.getAttribute('id');
  const book = listWrapper.querySelector(`[id="${id}"]`);
  fetch(`${url}/${id}`, {
    method: 'POST',
    body: JSON.stringify({ comment: commentToAdd.value }),
    headers: { 'Content-Type': 'application/json;charset=utf-8' },
  })
    .then((response) => {
      const status = response.status;
      return status >= 200 && status < 400 ? response.json() : response.text();
    })
    .then((data) => {
      if (typeof data === 'object') {
        const newComment = data.comments[data.comments.length - 1];
        const li = document.createElement('li');
        li.textContent = newComment;
        detailComments.appendChild(li);

        // Update comment counts in the book list
        book.textContent = book.textContent.replace(
          /\d+(?=\scomments)/,
          `${data.comments.length}`
        );
      } else {
        throw new Error(data);
      }
    })
    .catch((err) => {
      console.log(err);
    });
}

// Delete current book
function deleteBookHandler() {
  const id = deleteBookBtn.getAttribute('id');
  const removedBook = listWrapper.querySelector(`[id="${id}"]`);

  fetch(`${url}/${id}`, {
    method: 'DELETE',
  })
    .then((response) => response.text())
    .then((data) => {
      // Remove deleted book from the list
      listWrapper.removeChild(removedBook);

      detailComments.style.listStyle = 'none';
      detailComments.innerHTML = `<li style="color: red;">${data}</li>`;

      // Hide new comment form
      newCommentForm.style.display = 'none';
      newCommentForm.removeEventListener('submit', preventFormSubmit);
      addCommentBtn.removeEventListener('click', addCommentHandler);
      deleteBookBtn.removeEventListener('click', deleteBookHandler);
    })
    .catch((err) => {
      console.log(err);
    });
}

// Add new book
const newBookForm = document.getElementById('newBookForm');

newBookForm.addEventListener('submit', (e) => {
  e.preventDefault();
  fetch(url, {
    method: 'POST',
    body: JSON.stringify({ title: e.target.elements.title.value }),
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
    },
  })
    .then((response) => {
      const status = response.status;
      return status >= 200 && status < 400 ? response.json() : response.text();
    })
    .then((data) => {
      if (typeof data === 'object') {
        const id = data._id;
        const commentCount = data.comments.length;
        const title = data.title;
        const li = document.createElement('li');
        li.className = 'bookItem';
        li.setAttribute('id', id);
        li.textContent = `${title} - ${commentCount} comments`;
        li.addEventListener('click', showBookDetail.bind(this, title, id));
        listWrapper.appendChild(li);
      } else {
        throw new Error(data);
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

// Delete all books
const deleteAllBtn = document.getElementById('deleteAllBooks');
const responseMsg = document.getElementById('response-message');

deleteAllBtn.addEventListener('click', (e) => {
  const xhr = new XMLHttpRequest();
  xhr.open('DELETE', url, true);
  xhr.setRequestHeader('Content-Type', 'application/json; utf-8');
  xhr.onreadystatechange = () => {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      const status = xhr.status;
      if (status === 0 || (status >= 200 && status < 400)) {
        while (listWrapper.firstChild) {
          listWrapper.removeChild(listWrapper.firstChild);
        }
      }
      responseMsg.textContent = xhr.response;
    }
  };
  xhr.send(JSON.stringify({}));
});
