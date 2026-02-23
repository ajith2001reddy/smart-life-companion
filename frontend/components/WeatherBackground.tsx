"use client";

export type WeatherType =
    | "clear"
    | "clouds"
    | "rain"
    | "thunder"
    | "fog"
    | "night";

type Props = {
    type: WeatherType;
};

export default function WeatherBackground({ type }: Props) {
    return (
        <div className="absolute inset-0 overflow-hidden">
            {type === "clear" && (
                <div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-indigo-900" />
            )}

            {type === "clouds" && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-900" />
            )}

            {type === "rain" && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-black" />
            )}

            {type === "thunder" && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-black" />
            )}

            {type === "fog" && (
                <div className="absolute inset-0 bg-gray-500" />
            )}

            {type === "night" && (
                <div className="absolute inset-0 bg-gradient-to-br from-black to-indigo-950" />
            )}
        </div>
    );
}