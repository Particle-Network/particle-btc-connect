import { EventEmitter } from 'events';
import { EventName } from '../types/eventName';

const events = new EventEmitter();
events.setMaxListeners(100);

export const getPendingSignEventAccount = () => {
  return (
    events.listenerCount(EventName.sendUserOpResult) +
    events.listenerCount(EventName.personalSignResult) +
    events.listenerCount(EventName.signTypedDataResult)
  );
};

export default events;
