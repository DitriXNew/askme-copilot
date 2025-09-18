declare module 'sound-play' {
    export function play(audioPath: string): Promise<void>;
}