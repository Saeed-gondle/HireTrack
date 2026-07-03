"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import axios from "axios"

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export default function LinkLoginPage() {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      setLoading(true)
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/magic-link`, {
        email: data.email
      })
      toast.success("Magic link sent successfully")
      setSuccess(res.data.message)
      setError(false)
      form.reset()
    } catch (err: any) {
      console.log(err.message)
      setSuccess(false)
      setError(err.message)
      setLoading(false)
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data.message)
      }
      else
        toast.error(`Failed to send magic link ${err}`)
    }
  }

  return (
    <Card className="w-full sm:max-w-md">
      <CardHeader>
        <CardTitle>Login with magic link</CardTitle>
        <CardDescription>
          Enter your email and we'll send you a magic link to log in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="form-rhf-demo-title">
                    Email
                  </FieldLabel>
                  <Input
                    {...field}
                    id="form-rhf-demo-title"
                    type="email"
                    aria-invalid={fieldState.invalid}
                    placeholder="Login button not working on mobile"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <div className="text-center mt-4">
          {success &&
            <h2 className="text-center text-green-500">{success}</h2>
          }
          {error &&
            <h2 className="text-center text-red-500">{error}</h2>
          }
        </div>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" onClick={() => form.reset()} className="cursor-pointer" disabled={loading}>
            {loading ? "Resetting..." : "Reset"}
          </Button>
          <Button type="submit" form="form-rhf-demo" className="cursor-pointer" disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </Field>
      </CardFooter>
    </Card>
  )
}
