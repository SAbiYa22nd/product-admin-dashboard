# Product Admin Dashboard

A responsive Product Admin Dashboard built using Next.js, React, Tailwind CSS, Axios, and the DummyJSON API.

## Features

* User login using DummyJSON authentication
* Protected product dashboard
* Logout
* Product listing with:

  * Product image
  * Title
  * Category
  * Price
  * Rating
  * Stock
* Responsive desktop table and mobile card layout
* Pagination using API `limit` and `skip`
* Page sizes: 10, 20, and 50
* Previous and Next buttons
* Page numbers
* Search using DummyJSON search API
* Debounced search
* Category filtering
* Sorting by title, price, and rating
* Ascending and descending sorting
* Search, category, sorting, page, and page size stored in the URL
* Product details page
* Add product
* Edit product
* Delete product with confirmation
* Form validation
* Loading states
* Empty states
* Error states with Retry
* Shared Axios configuration
* Authentication token added to API requests
* Protection against outdated search responses

## Technologies Used

* Next.js
* React
* Tailwind CSS
* Axios
* JavaScript
* DummyJSON API

## Login Credentials

Use the following DummyJSON test credentials:

**Username:** `emilys`

**Password:** `emilyspass`

## API

The project uses the DummyJSON API:

`https://dummyjson.com`

Main endpoints used:

* `POST /auth/login`
* `GET /products`
* `GET /products/search?q=`
* `GET /products/categories`
* `GET /products/category/:category`
* `GET /products/:id`
* `POST /products/add`
* `PUT /products/:id`
* `DELETE /products/:id`

## Getting Started

Install the dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

`http://localhost:3000`

## Implementation Notes

### Search and Category Filter

The DummyJSON API provides separate endpoints for searching products and filtering products by category.

The application uses the search endpoint when a search term is entered. When there is no search term, the selected category endpoint is used.

This avoids combining incompatible search and category API requests.

### Add, Edit and Delete

DummyJSON product mutation endpoints simulate changes but do not permanently update the public dataset.

To keep added, edited, and deleted products visible in the application, the application maintains these changes using browser `localStorage`.

### Debounced Search

Search input is debounced to avoid sending an API request for every keystroke.

A request ID check is also used so that an older, slower response cannot overwrite the result of a newer search request.

### URL State

Pagination, page size, search, category, sorting field, and sorting order are reflected in the URL.

Invalid URL values are handled so that incorrect values do not break the application.

### Duplicate Requests

Login and save actions are disabled while their requests are in progress to prevent repeated submissions.

## AI Assistance

AI tools were used during development for debugging, implementation guidance, and understanding errors.

The implemented functionality was reviewed and tested during development.
