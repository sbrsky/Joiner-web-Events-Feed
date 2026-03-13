import branch from 'branch-sdk';
import { getStoredUTMs } from './utm';

const BRANCH_KEY = import.meta.env.VITE_BRANCH_KEY || (window as any).ENV?.VITE_BRANCH_KEY || (window as any).ENV?.BRANCH_KEY;

let branchInitialized = false;

export const initBranch = (): Promise<void> => {
    if (branchInitialized) return Promise.resolve();

    return new Promise((resolve, reject) => {
        if (!BRANCH_KEY) {
            console.warn('[Joiner] Branch key missing. Checked import.meta.env and window.ENV.');
            // We resolve anyway so the app doesn't crash, but deep links will fail gracefully
            resolve();
            return;
        }

        console.log('[Joiner] Initializing Branch with key:', BRANCH_KEY.substring(0, 8) + '...');

        branch.init(BRANCH_KEY, {}, (err: any) => {
            if (err) {
                console.error('Branch SDK init failed:', err);
                reject(err);
            } else {
                branchInitialized = true;
                resolve();
            }
        });
    });
};

export const generateEventDeepLink = async (event: any): Promise<string | null> => {
    try {
        await initBranch();
    } catch (e) {
        return null;
    }

    if (!branchInitialized) return null;

    return new Promise((resolve, reject) => {
        const rawName = event?.title || event?.name || 'Event';
        const name = rawName.length >= 200 ? `${rawName.substring(0, 199)}...` : rawName;

        const rawDesc = event?.description || '';
        const description = rawDesc.length >= 220 ? `${rawDesc.substring(0, 219)}...` : rawDesc;

        const dateText = event?.date || '';
        const contentDescription = dateText ? `${dateText} - ${description}` : description;

        const incomingUtms = getStoredUTMs();

        branch.link(
            {
                channel: 'webview',
                feature: 'event_sharing',
                campaign: `event_${event?.id?.toString() || 'share'}`,
                tags: ['event', 'joiner', 'webview'],
                data: {
                    $canonical_identifier: 'event',
                    $og_title: name,
                    $og_description: contentDescription,
                    $og_image_url: event?.image || event?.photo || '',
                    eventId: event?.id?.toString(),
                    utm_source: incomingUtms.utm_source || 'webview',
                    utm_medium: incomingUtms.utm_medium || 'event_sharing',
                    utm_campaign: incomingUtms.utm_campaign || `share_event_${event?.id?.toString() || 'id'}`,
                    utm_content: incomingUtms.utm_content || `event_${event?.id?.toString() || 'unknown'}`,
                    utm_term: incomingUtms.utm_term || '',
                    ...incomingUtms, // Spread all incoming UTMs to ensure they are all present
                    $ios_nativelink: true,
                },
            },
            (err: any, link: any) => {
                if (err) {
                    console.error('Failed to generate branch link:', err);
                    reject(err);
                } else {
                    resolve(link);
                }
            }
        );
    });
};
