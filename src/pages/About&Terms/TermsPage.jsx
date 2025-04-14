import { motion } from "framer-motion";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white p-8 text-gray-800">
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="max-w-4xl mx-auto"
            >
                <h1 className="text-4xl font-bold text-blue-600 mb-6 text-center">Terms of Use</h1>
                <p className="mb-6">
                    Welcome to Irshadi! These Terms of Use explain the rules for using our website and browser extension. By using our system, you agree to these rules. If you don’t agree, please don’t use it.
                </p>

                <div className="space-y-8">
                    {[
                        {
                            title: "1. What Our System Does",
                            content:
                                "Our website and browser extension help students and faculty manage course registration. The extension pulls your academic info—like courses you’ve finished, credit hours, and if you’re graduating soon—from your school’s dashboard. This makes it easier for students to choose classes for next semester and helps faculty plan schedules based on what students need.",
                        },
                        {
                            title: "2. Who Can Use It",
                            content: (
                                <ul className="list-disc list-inside">
                                    <li>You must be a student or faculty member at your school.</li>
                                    <li>You need a valid school account to log in.</li>
                                    <li>Don’t share your account or let others use it. Keep your login details safe.</li>
                                </ul>
                            ),
                        },
                        {
                            title: "3. How to Use Our System",
                            content: (
                                <>
                                    <p className="font-medium">You can:</p>
                                    <ul className="list-disc list-inside mb-4">
                                        <li>Use the extension to get your academic info (students).</li>
                                        <li>Pick courses you want to take next semester (students).</li>
                                        <li>See reports or schedule ideas (students and faculty).</li>
                                        <li>Check data to plan classes, like how many sections to offer (faculty admins).</li>
                                    </ul>
                                    <p className="font-medium">You cannot:</p>
                                    <ul className="list-disc list-inside">
                                        <li>Use the system to harm others or your school.</li>
                                        <li>Try to hack, change, or misuse our website or extension.</li>
                                        <li>Share or sell any data from our system.</li>
                                    </ul>
                                </>
                            ),
                        },
                        {
                            title: "4. Your Data and Privacy",
                            content:
                                "The extension collects your academic info from your school’s dashboard to help you pick classes. We won’t share your personal details with anyone outside your school unless required by law. Using our system means you allow us to collect and use your info as described. See our Privacy Policy for more.",
                        },
                        {
                            title: "5. School Rules",
                            content:
                                "Our system follows your school’s policies. You must follow them too. If you think we’re accessing something we shouldn’t, let us know right away.",
                        },
                        {
                            title: "6. Our Responsibilities",
                            content:
                                "We work hard to keep our website and extension running, but we can’t promise perfection. We’re not responsible if something goes wrong with your registration due to the system. We may update features without notice.",
                        },
                        {
                            title: "7. Your Responsibilities",
                            content:
                                "Use the system honestly and check that your course info is correct. Report problems like wrong data or unauthorized use of your account.",
                        },
                        {
                            title: "8. Ending Access",
                            content:
                                "We can suspend access if these rules are broken. You can stop using the system anytime by logging out and uninstalling the extension.",
                        },
                        {
                            title: "9. Changes to These Terms",
                            content:
                                "We may update these terms. If we make major changes, we’ll notify you via email or our site. Using the system after updates means you accept the new terms.",
                        },
                        {
                            title: "10. Contact Us",
                            content: (
                                <ul className="list-disc list-inside">
                                    <li>Email: <a href="mailto:contact@registrationproject.example.com" className="text-blue-600 underline">Hamooz150@hotmail.com</a></li>
                                    <li>Website: <a href="https://yourwebsite.example.com/support" className="text-blue-600 underline">yourwebsite.example.com/support</a></li>
                                </ul>
                            ),
                        },
                    ].map((section, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 * index }}
                        >
                            <h2 className="text-xl font-semibold text-blue-500 mb-2">{section.title}</h2>
                            <div className="text-gray-700">{section.content}</div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
