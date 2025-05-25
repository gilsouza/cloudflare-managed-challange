"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { requestSubmit } from "@/services";

export function SubmitForm() {
  const [field1, setField1] = useState("");
  const [field2, setField2] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await requestSubmit({ field1, field2 });

      debugger;

      if (response.status === 200) {
        toast({
          title: "Success!",
          description: response.data.message || "Form submitted successfully.",
        });
        setField1("");
        setField2("");
      } else {
        toast({
          title: `Error ${response.status}`,
          description: response.data.message || "Failed to submit form.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Request Error!",
        description:
          error instanceof Error
            ? error.message
            : "Could not connect to the server or process the request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl rounded-lg">
      <CardHeader className="p-6">
        <CardTitle className="text-3xl font-bold text-center text-primary">
          Form Submitter
        </CardTitle>
        <CardDescription className="text-center pt-2 text-muted-foreground">
          Enter your details below and click submit. The security check runs
          invisibly.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <Label htmlFor="field1" className="text-sm font-medium">
              Input Field 1
            </Label>
            <Input
              id="field1"
              type="text"
              placeholder="Enter value for first field"
              value={field1}
              onChange={(e) => setField1(e.target.value)}
              required
              disabled={isLoading}
              className="rounded-md"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="field2" className="text-sm font-medium">
              Input Field 2
            </Label>
            <Input
              id="field2"
              type="text"
              placeholder="Enter value for second field"
              value={field2}
              onChange={(e) => setField2(e.target.value)}
              required
              disabled={isLoading}
              className="rounded-md"
            />
          </div>
        </CardContent>
        <CardFooter className="p-6 flex flex-col">
          <div id="cf-turnstile-container" />
          <Button
            type="submit"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-md py-3 text-base font-semibold"
            disabled={isLoading}
            aria-live="polite"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Data"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
