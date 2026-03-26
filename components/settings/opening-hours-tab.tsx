"use client"

import { useState } from "react"
import { useSettings } from "@/hooks/use-settings"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"
import { toast } from "sonner"

const WEEKDAYS = [
  { key: "mon", label: "Montag" },
  { key: "tue", label: "Dienstag" },
  { key: "wed", label: "Mittwoch" },
  { key: "thu", label: "Donnerstag" },
  { key: "fri", label: "Freitag" },
  { key: "sat", label: "Samstag" },
  { key: "sun", label: "Sonntag" },
] as const

interface DayConfig {
  enabled: boolean
  open: string
  close: string
}

type WeekConfig = Record<string, DayConfig>

function hoursToWeekConfig(hours: [string, string, string][]): WeekConfig {
  const config: WeekConfig = {}
  for (const { key } of WEEKDAYS) {
    config[key] = { enabled: false, open: "09:00", close: "17:00" }
  }
  for (const [day, open, close] of hours) {
    if (config[day]) {
      config[day] = { enabled: true, open, close }
    }
  }
  return config
}

function weekConfigToHours(config: WeekConfig): [string, string, string][] {
  return WEEKDAYS
    .filter(({ key }) => config[key].enabled)
    .map(({ key }) => [key, config[key].open, config[key].close])
}

export function OpeningHoursTab() {
  const { settings, updateSettings } = useSettings()

  const [weekConfig, setWeekConfig] = useState<WeekConfig>(() =>
    hoursToWeekConfig(settings.opening_hours)
  )
  const [isSaving, setIsSaving] = useState(false)

  const updateDay = (day: string, update: Partial<DayConfig>) => {
    setWeekConfig((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...update },
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const hours = weekConfigToHours(weekConfig)
      const success = await updateSettings({ opening_hours: hours })
      if (success) {
        toast.success("Öffnungszeiten gespeichert")
      }
    } catch (error) {
      console.error("Failed to save opening hours:", error)
      toast.error("Fehler beim Speichern der Öffnungszeiten")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Öffnungszeiten
          </CardTitle>
          <CardDescription>
            Lege fest, wann dein leih.lokal geöffnet ist. Diese Zeiten werden für die
            Reservierungsvalidierung und die öffentliche Anzeige verwendet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {WEEKDAYS.map(({ key, label }) => (
            <div
              key={key}
              className="flex items-center gap-4 py-2 border-b last:border-b-0"
            >
              <Switch
                id={`day-${key}`}
                checked={weekConfig[key].enabled}
                onCheckedChange={(checked) =>
                  updateDay(key, { enabled: checked })
                }
              />
              <Label
                htmlFor={`day-${key}`}
                className="w-28 font-medium"
              >
                {label}
              </Label>
              {weekConfig[key].enabled ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={weekConfig[key].open}
                    onChange={(e) => updateDay(key, { open: e.target.value })}
                    className="w-32"
                  />
                  <span className="text-muted-foreground">–</span>
                  <Input
                    type="time"
                    value={weekConfig[key].close}
                    onChange={(e) => updateDay(key, { close: e.target.value })}
                    className="w-32"
                  />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Geschlossen</span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Speichert..." : "Änderungen speichern"}
        </Button>
      </div>
    </div>
  )
}
