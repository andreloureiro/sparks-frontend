# Sparks.Network

> Frontend for Sparks.Network Volunteer Software

## Architectural Decision Records

We keep records of architectural decisions in [./docs/adrs/](./docs/adrs/).

## Styles

We use patternlab in sparks-design-system to create css styles for this project.  [See more info about patternlab and how to use it](http://patternlab.io/docs/index.html).

### Naming Conventions

* See [the BEM system](https://en.bem.info/methodology/quick-start/)
* [A good intro](http://csswizardry.com/2013/01/mindbemding-getting-your-head-round-bem-syntax/)
* [And then namespaces](http://csswizardry.com/2015/03/more-transparent-ui-code-with-namespaces/)

### Basic steps

1. Create sass/components/_components.foo.scss
2. Create _patterns/10-basics/foo/NN-foo-styles.mustache
3. Commit and push sparks-design-system
4. npm install to update

## Test Files in the `src` Directory

All files ending with `.test.ts` are unit tests for files of the same
corresponding name (neighbor).

All files ending with `.int-test.ts` are integration tests for files of the
same corresponding name (neighbor). Integration is abbreviated as _int_ to
avoid common typos.

## End to End tests

You can run end to end tests using the command `npm run test:e2e`.
Make sure you have the environment variables set as described below.

If you need to run only 1 of the tests you can use
```sh
npm run test:e2e -- --test ./tests/.tmp/e2e/name-of-test-file-name.js
```

### E2E firebase

#### Enable Sign-on methods
Whichever Firebase instance you use, it has to have three sign-on methods
enabled in the Firebase console: Email, Facebook, Google.  Follow their
instructions if you're setting up a private test database.

#### Get service account credentials

You will need to get service account credentials for the firebase you're
running e2e tests against.

Follow these instructions: https://firebase.google.com/docs/admin/setup 

## Environment Variables

The current environment variables that the application needs in order to run.

#### Firebase-related

These variables can be found by clicking "Add Firebase to your web app" on
the overview of your firebase application page.

- **FIREBASE_DATABASE_URL**
  - URL the point to your Firbase database. Usually looks like https://*application-name*.firebaseio.com
- **FIREBASE_API_KEY**
  - Unique API key from Firebase.
- **FIREBASE_AUTH_DOMAIN**
  - Where Firebase communicates to various authentication endpoints. Usually looks like *application-name*.firebaseapp.com
- **FIREBASE_STORAGE_BUCKET**
  - Where your Firebase Storage is located. Usually looks like *application-name*.appspot.com
- **FIREBASE_MESSAGING_SENDER_ID**
  - A unique key firebase uses to associate push notifications to your application.

#### Integration-test-related

In all these cases you may use your own accounts.  For automated tests you
should use SN test account credentials.

- **GOOGLE_TEST_EMAIL**
  - Must be a valid Google email address.
- **GOOGLE_TEST_EMAIL_PASSWORD**
  - Must be a valid Google email password.
- **FACEBOOK_TEST_EMAIL**
  - Must be a email address for an existing Facebook account.
- **FACEBOOK_TEST_EMAIL_PASSWORD**
  - Must be the password for that Facebook account.
- **EMAIL_TEST_EMAIL**
  - Any valid email address, used to create a new account
- **EMAIL_TEST_PASSWORD**
  - Any valid password, used to create a new account
