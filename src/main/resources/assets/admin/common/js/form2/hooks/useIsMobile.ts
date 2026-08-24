import {getIsMobile, subscribeToMobileChanges} from '@enonic/ui';
import {useEffect, useState} from 'react';

export function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(getIsMobile);

    useEffect(() => subscribeToMobileChanges(setIsMobile), []);

    return isMobile;
}
