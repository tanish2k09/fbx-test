export type ScrubberProps = {
    className?: string
    timestamps: Float32Array,
    index: number,
    min: number,
    max: number,
    step: number,
    handleScrub: (e: any) => void
}

export const DefaultScrubberStyle = "absolute bottom-4 flex flex-col items-center justify-center w-screen text-red-500 p-4"

export default function Scrubber({ props }: { props: ScrubberProps | null }) {
    if (!props) return null;

    return <div className={props.className}>
        <input className={"w-full"}
            type="range"
            min={props.min}
            max={props.max}
            step={props.step}
            value={props.index}
            onChange={props.handleScrub}
        />
        <div>Current Time: {props.timestamps[props.index].toFixed(2)}s</div>
    </div>
}