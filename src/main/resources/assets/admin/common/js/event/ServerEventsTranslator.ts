import {EventJson} from './EventJson';
import {Event} from './Event';
import {ApplicationEvent, ApplicationEventJson} from '../application/ApplicationEvent';
import {RepositoryEvent} from '../content/event/RepositoryEvent';
import {TaskEvent, TaskEventJson} from '../task/TaskEvent';

export class ServerEventsTranslator {

    translateServerEvent(eventJson: EventJson): Event {
        const eventType: string = eventJson.type;

        if (eventType === 'application') {
            return ApplicationEvent.fromJson(<ApplicationEventJson>eventJson);
        }

        if (eventType.startsWith('repository.')) {
            return RepositoryEvent.fromJson(eventJson);
        }

        if (eventType.startsWith('task.')) {
            return TaskEvent.fromJson(<TaskEventJson>eventJson);
        }

        return null;
    }

}
