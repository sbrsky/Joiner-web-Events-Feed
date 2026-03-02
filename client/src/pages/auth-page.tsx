import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, InsertUser } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

export default function AuthPage() {
    const { user, loginMutation, registerMutation } = useAuth();

    const loginForm = useForm<InsertUser>({
        resolver: zodResolver(insertUserSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    const registerForm = useForm<InsertUser>({
        resolver: zodResolver(insertUserSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });

    if (user) {
        return <Redirect to="/" />;
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            <div className="flex items-center justify-center p-8">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Welcome to Joiner</CardTitle>
                        <CardDescription>
                            Connect with people and discover amazing events.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="login" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-8">
                                <TabsTrigger value="login">Login</TabsTrigger>
                                <TabsTrigger value="register">Register</TabsTrigger>
                            </TabsList>

                            <TabsContent value="login">
                                <Form {...loginForm}>
                                    <form
                                        onSubmit={loginForm.handleSubmit((data) =>
                                            loginMutation.mutate(data)
                                        )}
                                        className="space-y-4"
                                    >
                                        <FormField
                                            control={loginForm.control}
                                            name="username"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Username</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter username" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={loginForm.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Password</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="password"
                                                            placeholder="Enter password"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={loginMutation.isPending}
                                        >
                                            {loginMutation.isPending && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            Login
                                        </Button>
                                    </form>
                                </Form>
                            </TabsContent>

                            <TabsContent value="register">
                                <Form {...registerForm}>
                                    <form
                                        onSubmit={registerForm.handleSubmit((data) =>
                                            registerMutation.mutate(data)
                                        )}
                                        className="space-y-4"
                                    >
                                        <FormField
                                            control={registerForm.control}
                                            name="username"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Username</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Choose username" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={registerForm.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Password</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="password"
                                                            placeholder="Choose password"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={registerMutation.isPending}
                                        >
                                            {registerMutation.isPending && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            Register
                                        </Button>
                                    </form>
                                </Form>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
            <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-muted/30 relative overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center brightness-50 contrast-[1.1]"
                    style={{ backgroundImage: `url('/joiner_auth_bg.png')` }}
                />
                <div className="relative z-10 text-center max-w-lg">
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-6">
                        Join the Joiner Community
                    </h1>
                    <p className="text-xl text-white/90">
                        The easiest way to find and join local events, meet new people, and
                        build your social circle.
                    </p>
                </div>
            </div>
        </div>
    );
}
