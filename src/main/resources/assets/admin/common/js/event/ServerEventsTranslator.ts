import {EventJson} from './EventJson';
import {Event} from './Event';
import {ApplicationEvent, ApplicationEventJson} from '../application/ApplicationEvent';
import {RepositoryEvent} from '../content/event/RepositoryEvent';
import {TaskEvent, TaskEventJson} from '../task/TaskEvent';

export class ServerEventsTranslator {

    translateServerEvent(eventJson: EventJson): Event {
        const eventType: string = eventJson.type;

        if (eventType === 'application') {
            return ApplicationEvent.fromJson(eventJson as ApplicationEventJson);
        }

        if (eventType.indexOf('repository.') === 0) {
            return RepositoryEvent.fromJson(eventJson);
        }

        if (eventType.indexOf('task.') === 0) {
            return TaskEvent.fromJson(eventJson as TaskEventJson);
        }

        return null;
    }

}
