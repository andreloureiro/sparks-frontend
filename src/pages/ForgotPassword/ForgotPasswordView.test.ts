/// <reference path="../../../typings/index.d.ts" />
import * as assert from 'assert';
import {keys} from 'ramda'
import firebase = require('firebase');
import {
  AuthenticationError
} from '../../drivers/firebase-authentication';
import {isSink} from '../../utils/testing/checks'

//import { MockFirebase } from './MockFirebase';
//import { mockStream } from './MockStream';
import {AuthenticationState} from './types'
import {
  div, span, section, form, fieldset, label, a, p, input, h1, h4, button, VNode
} from '@motorcycle/dom';
import {Stream, combine, merge as mergeM, empty} from 'most';
import {cssClasses} from '../../utils/classes';
import {forgotPasswordView, ForgotPasswordView} from './ForgotPasswordView';

const classes = cssClasses({});
const backgroundImage = require('assets/images/login-background.jpg');

// TODO : find a way not to duplicate this with the actual view implementation
// Views corresponding to the miscellaneous authenticatation states
const viewNoAuthError = section(classes.sel('photo-background'), {
  style: {
    // QUESTION: where does this url function comes from
    backgroundImage: `url(${backgroundImage})`
  }
}, [
  h1('sparks.network'),
  div([
    div(classes.sel('login', 'box'), [
      h1({polyglot: {phrase: 'forgotPassword.title'}} as any),
      div(classes.sel('login', 'form'), [
        form([
          fieldset([
            label({
              props: {for: 'email'},
              polyglot: {phrase: 'login.email'}
            } as any),
            input(classes.sel('login.email'), {
              props: {
                type: 'email',
                name: 'email'
              }
            } as any),
          ]),
          fieldset(classes.sel('actions'), [
            // add type="button" to avoid submit behavior
            button(classes.sel('cancel'), {
              polyglot: {phrase: 'forgotPassword.cancel'},
              attrs: {type: 'button'}
            } as any),
// button('cancel', {
// polyglot: {phrase: 'forgotPassword.cancel'}, attrs:
// {type:'button'}} as any),
            button(classes.sel('submit'), {
              polyglot: {phrase: 'forgotPassword.send'}
            } as any)
          ])
        ]),
        h4(classes.sel(''), {
          polyglot: {phrase: 'error.auth.none'}
        } as any)
      ]),
    ]),
  ])
]);

const viewAuthErrorInvalidEmail = section(classes.sel('photo-background'), {
  style: {
    // QUESTION: where does this url function comes from
    backgroundImage: `url(${backgroundImage})`
  }
}, [
  h1('sparks.network'),
  div([
    div(classes.sel('login', 'box'), [
      h1({polyglot: {phrase: 'forgotPassword.title'}} as any),
      div(classes.sel('login', 'form'), [
        form([
          fieldset([
            label({
              props: {for: 'email'},
              polyglot: {phrase: 'login.email'}
            } as any),
            input(classes.sel('login.email'), {
              props: {
                type: 'email',
                name: 'email'
              }
            } as any),
          ]),
          fieldset(classes.sel('actions'), [
            // add type="button" to avoid submit behavior
            button(classes.sel('cancel'), {
              polyglot: {phrase: 'forgotPassword.cancel'},
              attrs: {type: 'button'}
            } as any),
// button('cancel', {
// polyglot: {phrase: 'forgotPassword.cancel'}, attrs:
// {type:'button'}} as any),
            button(classes.sel('submit'), {
              polyglot: {phrase: 'forgotPassword.send'}
            } as any)
          ])
        ]),
        h4(classes.sel('error'), {
          polyglot: {phrase: 'error.auth.invalid-email'}
        } as any)
      ]),
    ]),
  ])
]);

const viewAuthErrorUserNotFound = section(classes.sel('photo-background'), {
  style: {
    // QUESTION: where does this url function comes from
    backgroundImage: `url(${backgroundImage})`
  }
}, [
  h1('sparks.network'),
  div([
    div(classes.sel('login', 'box'), [
      h1({polyglot: {phrase: 'forgotPassword.title'}} as any),
      div(classes.sel('login', 'form'), [
        form([
          fieldset([
            label({
              props: {for: 'email'},
              polyglot: {phrase: 'login.email'}
            } as any),
            input(classes.sel('login.email'), {
              props: {
                type: 'email',
                name: 'email'
              }
            } as any),
          ]),
          fieldset(classes.sel('actions'), [
            // add type="button" to avoid submit behavior
            button(classes.sel('cancel'), {
              polyglot: {phrase: 'forgotPassword.cancel'},
              attrs: {type: 'button'}
            } as any),
// button('cancel', {
// polyglot: {phrase: 'forgotPassword.cancel'}, attrs:
// {type:'button'}} as any),
            button(classes.sel('submit'), {
              polyglot: {phrase: 'forgotPassword.send'}
            } as any)
          ])
        ]),
        h4(classes.sel('error'), {
          polyglot: {phrase: 'error.auth.user-not-found'}
        } as any)
      ]),
    ]),
  ])
]);

const viewAuthErrorUserLoggedIn = section(classes.sel('photo-background'), {
  style: {
    // QUESTION: where does this url function comes from
    backgroundImage: `url(${backgroundImage})`
  }
}, [
  h1('sparks.network'),
  div([
    div(classes.sel('login', 'box'), [
      h1({polyglot: {phrase: 'forgotPassword.title'}} as any),
      div(classes.sel('login', 'form'), [
        form([
          fieldset([
            label({
              props: {for: 'email'},
              polyglot: {phrase: 'login.email'}
            } as any),
            input(classes.sel('login.email'), {
              props: {
                type: 'email',
                name: 'email'
              }
            } as any),
          ]),
          fieldset(classes.sel('actions'), [
            // add type="button" to avoid submit behavior
            button(classes.sel('cancel'), {
              polyglot: {phrase: 'forgotPassword.cancel'},
              attrs: {type: 'button'}
            } as any),
// button('cancel', {
// polyglot: {phrase: 'forgotPassword.cancel'}, attrs:
// {type:'button'}} as any),
            button(classes.sel('submit'), {
              polyglot: {phrase: 'forgotPassword.send'}
            } as any)
          ])
        ]),
        h4(classes.sel('warning'), {
          polyglot: {phrase: 'error.auth.none'}
        } as any)
      ]),
    ]),
  ])
]);

describe('On receiving the authentication state corresponding to a user not' +
  ' logged-in, and who have not yet been attempted to be identified', () => {
  const authenticationState: AuthenticationState = {
    isAuthenticated: false,
    authenticationError: null
  }
  const actual = forgotPasswordView(authenticationState);
  const expected = viewNoAuthError;

  it('should not display any feedback message, should display a form' +
    ' allowing to send an email, and a cancel and send button', () => {
    const message = [
      'should not display a feedback message',
      'should display a form allowing to send an email',
      'should display a cancel and send button'
    ].join('\n')

    assert.deepStrictEqual(actual, expected, message);
  });
});

describe('On receiving a authentication error', () => {
  const authenticationStateInvalidEmail: AuthenticationState = {
    isAuthenticated: false,
    authenticationError: {
      code: 'auth/invalid-email',
      message: 'dummy'
    } as AuthenticationError
  }

  const actualInvalidEmail = forgotPasswordView(authenticationStateInvalidEmail);

  it('should display an invalid email error in case of a' +
    ' auth/invalid-email authentication error', () => {
    const message = [
      'should not display a feedback message',
      'should display a form allowing to send an email',
      'should display a cancel and send button'
    ].join('\n')

    assert.deepStrictEqual(actualInvalidEmail, viewAuthErrorInvalidEmail, message);
  });

  it('should display an user not found error in case of a' +
    ' auth/user-not-found authentication error', () => {
    const authenticationStateUserNotFound: AuthenticationState = {
      isAuthenticated: false,
      authenticationError: {
        code: 'auth/user-not-found',
        message: 'dummy'
      } as AuthenticationError
    }

    const actualUserNoFound = forgotPasswordView(authenticationStateUserNotFound);

    const message = [
      'should not display a feedback message',
      'should display a form allowing to send an email',
      'should display a cancel and send button'
    ].join('\n')

    assert.deepStrictEqual(actualUserNoFound, viewAuthErrorUserNotFound, message);
  });

});

describe('On receiving a authentication message which indicates the user is' +
  ' logged-in', () => {
  const authenticationStateUserLoggedIn: AuthenticationState = {
    isAuthenticated: true,
    authenticationError: null
  }

  const actualUserLoggedIn = forgotPasswordView(authenticationStateUserLoggedIn);

  it('should display a warning message', () => {
    const message = [
      'should display a warning message',
      'should display a form allowing to send an email',
      'should display a cancel and send button'
    ].join('\n')

    assert.deepStrictEqual(actualUserLoggedIn, viewAuthErrorUserLoggedIn, message);
  });

});

describe('ForgotPasswordView component', () => {
  it('returns a DOM sink and only a DOM sink', (done) => {
    const sources = {
      authenticationState$ : empty()
    }
    const actualSinks = ForgotPasswordView(sources)
    assert.ok(isSink(actualSinks.DOM), 'returns a DOM sink')
    assert.equal(keys(actualSinks).length, 1, 'returns only a DOM sink')
    done();
  })

 // TODO : spying on forgotPasswordView and checking that it is called
  // with the values from authenticationState$

});