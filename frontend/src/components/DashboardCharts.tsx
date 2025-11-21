import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js'
import { Line, Bar, Radar } from 'react-chartjs-2'
import { format } from 'date-fns'
import type { ExerciseSession, TremorMeasurement, ExerciseQuality } from '../../../shared/types'

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    RadialLinearScale,
    Title,
    Tooltip,
    Legend,
    Filler
)

interface RepsChartProps {
    sessions: ExerciseSession[]
}

export const RepsChart = ({ sessions }: RepsChartProps) => {
    const data = {
        labels: sessions.map(s => format(new Date(s.startTime), 'dd/MM')),
        datasets: [
            {
                label: 'חזרות (Reps)',
                data: sessions.map(s => s.reps),
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
                borderColor: 'rgb(99, 102, 241)',
                borderWidth: 1,
            },
        ],
    }

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'התקדמות חזרות לאורך זמן',
            },
        },
    }

    return <Bar data={data} options={options} />
}

interface TremorChartProps {
    measurements: TremorMeasurement[]
}

export const TremorChart = ({ measurements }: TremorChartProps) => {
    const data = {
        labels: measurements.map(m => format(new Date(m.timestamp), 'dd/MM')),
        datasets: [
            {
                fill: true,
                label: 'עוצמת רעד (Amplitude)',
                data: measurements.map(m => m.amplitude),
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
            },
        ],
    }

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'מגמת שיפור ברעד',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    }

    return <Line data={data} options={options} />
}

interface QualityRadarProps {
    quality: ExerciseQuality
}

export const QualityRadar = ({ quality }: QualityRadarProps) => {
    const data = {
        labels: ['יציבות', 'סימטריה', 'טווח תנועה', 'קצב', 'ציון כללי'],
        datasets: [
            {
                label: 'איכות ביצוע נוכחית',
                data: [
                    quality.stability,
                    quality.symmetry,
                    quality.rangeOfMotion,
                    quality.tempo,
                    quality.overallScore,
                ],
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 1,
            },
        ],
    }

    const options = {
        responsive: true,
        scales: {
            r: {
                angleLines: {
                    display: false
                },
                suggestedMin: 0,
                suggestedMax: 100
            }
        }
    }

    return <Radar data={data} options={options} />
}
