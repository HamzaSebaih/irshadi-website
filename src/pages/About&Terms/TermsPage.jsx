import { motion } from 'framer-motion';

const TermsPage = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto py-8"
        >
            <h1 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 to-cyan-400 text-transparent bg-clip-text text-center">Terms of Use</h1>
            <p className="mb-6">
                Welcome to Irshadi! These Terms of Use explain the rules for using our website and browser extension. By using our system, you agree to these rules. If you don't agree, please don't use it.
            </p>

            <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-2 text-gray-700"
            >
                <h2 className="text-xl font-semibold text-blue-500 mb-2">1. What Our System Does</h2>
                <p>
                    Our website and browser extension help students and faculty members manage course registration. The extension pulls your academic info—like courses you've finished, credit hours, and if you're graduating soon—from your university's academic dashboard. This makes it easier for students to choose courses for next semester and helps faculty members plan schedules based on what students need.
                </p>
                <h2 className="text-xl font-semibold text-blue-500 mb-2">2. Who Can Use It</h2>
                <ul className="list-disc list-inside ">
                    <li>You must be a student or faculty member at your university.</li>
                    <li>You need a valid university account to log in.</li>
                    <li>Don’t share your account or let others use it. Keep your login details safe.</li>
                </ul>

                <h2 className="text-xl font-semibold text-blue-500 mb-2">3. How to Use Our System</h2>
                <p className="font-medium">You can:</p>
                <ul className="list-disc list-inside mb-4">
                    <li>Use the extension to get your academic info (students).</li>
                    <li>Pick courses you want to take next semester (students).</li>
                    <li>See reports or schedule ideas (students and faculty members).</li>
                    <li>Check data to plan classes, like how many sections to offer (faculty members).</li>
                </ul>
                <p className="font-medium">You cannot:</p>
                <ul className="list-disc list-inside">
                    <li>Use the system to harm others or your university.</li>
                    <li>Try to hack, change, or misuse our website or extension.</li>
                    <li>Share or sell any data from our system.</li>
                </ul>

                <h2 className="text-xl font-semibold text-blue-500 mb-2">4. Your Data and Privacy</h2>
                <p>
                    The extension collects your academic info from your university's academic dashboard to help you pick classes. We won't share your personal details with anyone outside your university unless required by law. Using our system means you allow us to collect and use your info as described. See our Privacy Policy for more.
                </p>

                <h2 className="text-xl font-semibold text-blue-500 mb-2">5. Univerity Rules</h2>
                <p>
                    Our system follows your university's policies. You must follow them too. If you think we're accessing something we shouldn't, let us know right away.
                </p>

                <h2 className="text-xl font-semibold text-blue-500 mb-2">6. Our Responsibilities</h2>
                <p>
                    We work hard to keep our website and extension running, but we can't promise perfection. We're not responsible if something goes wrong with your registration due to the system. We may update features without notice.
                </p>

                <h2 className="text-xl font-semibold text-blue-500 mb-2">7. Your Responsibilities</h2>
                <p>
                    Use the system honestly and check that your course info is correct. Report problems like wrong data or unauthorized use of your account.
                </p>

                <h2 className="text-xl font-semibold text-blue-500 mb-2">8. Ending Access</h2>
                <p>
                    We can suspend access if these rules are broken. You can stop using the system anytime by logging out and uninstalling the extension.
                </p>

                <h2 className="text-xl font-semibold text-blue-500 mb-2">9. Changes to These Terms</h2>
                <p>
                    We may update these terms. If we make major changes, we'll notify you via email or our site. Using the system after updates means you accept the new terms.
                </p>

                <h2 className="text-xl font-semibold text-blue-500 mb-2">10. Contact Us</h2>
                <ul className="list-disc list-inside">
                    <li>Email: <a href="mailto:Hamooz150@hotmail.com" className="text-blue-600 underline">Hamooz150@hotmail.com</a></li>
                </ul>
            </motion.div>
        </motion.div>
    );
};

export default TermsPage;
