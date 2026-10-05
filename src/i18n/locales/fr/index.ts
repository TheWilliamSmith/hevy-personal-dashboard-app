import type { MessageSchema } from '../en';
import type { Messages } from '../../types';
import * as auth from './auth';
import * as body from './body';
import * as calculators from './calculators';
import * as catalog from './catalog';
import * as common from './common';
import * as dashboard from './dashboard';
import * as data from './data';
import * as exercises from './exercises';
import * as friends from './friends';
import * as goals from './goals';
import * as imports from './imports';
import * as messages from './messages';
import * as privacy from './privacy';
import * as progress from './progress';
import * as settings from './settings';
import * as trophies from './trophies';
import * as workouts from './workouts';

export const fr: Messages<MessageSchema> = {
  ...auth,
  ...body,
  ...calculators,
  ...catalog,
  ...common,
  ...dashboard,
  ...data,
  ...exercises,
  ...friends,
  ...goals,
  ...imports,
  ...messages,
  ...privacy,
  ...progress,
  ...settings,
  ...trophies,
  ...workouts,
};
