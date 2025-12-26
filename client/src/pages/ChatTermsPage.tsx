
interface ChatTermsPageProps {
  onNavigate?: (page: string) => void;
}

const ChatTermsPage = ({ onNavigate }: ChatTermsPageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50" style={{ fontFamily: 'Satoshi, sans-serif' }}>
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.close()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors transition-all duration-300"
              data-testid="back-button"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="bg-[#A0FAB2] p-2 rounded-lg">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Chat Terms & Conditions</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Introduction Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Secure & Educational Messaging</h2>
          </div>
          <p className="text-gray-600 text-lg leading-relaxed">
            Welcome to EduFiliova's secure messaging platform. Our chat system is designed to facilitate educational communication between students, teachers, and administrators in a safe, respectful environment.
          </p>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <h3 className="text-xl font-bold text-gray-900">End-to-End Encryption</h3>
          </div>
          <div className="space-y-4">
            <p className="text-gray-600">
              Your messages are protected with industry-standard end-to-end encryption. This means:
            </p>
            <ul className="space-y-3 ml-4">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#A0FAB2] rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-600">Only you and the intended recipient can read your messages</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#A0FAB2] rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-600">Messages are encrypted on your device before being sent</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-[#A0FAB2] rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-gray-600">Even EduFiliova cannot access your private conversations</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Community Guidelines */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-100 p-2 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Community Guidelines</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 text-lg">✅ What's Encouraged</h4>
              <ul className="space-y-3 ml-4">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-600"><strong>Educational discussions</strong> - Ask questions, share knowledge, discuss subjects</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-600"><strong>Study groups</strong> - Collaborate on assignments and projects</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-600"><strong>Teacher-student communication</strong> - Get help and guidance from educators</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-600"><strong>Respectful conversations</strong> - Maintain professional and courteous communication</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-600"><strong>Support and encouragement</strong> - Help fellow students succeed academically</span>
                </li>
              </ul>
            </div>

            <div className="bg-primary/10 border border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-primary-600" />
                <h4 className="font-semibold text-primary-900 text-lg">❌ Strictly Prohibited</h4>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-primary-800"><strong>No abuse or harassment</strong> - Any form of bullying, threats, or intimidation</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-primary-800"><strong>No inappropriate content</strong> - Sexually explicit, violent, or disturbing material</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-primary-800"><strong>No dating or romantic pursuits</strong> - This platform is for education only</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-primary-800"><strong>No spam or commercial content</strong> - Unauthorized advertising or promotional messages</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-primary-800"><strong>No sharing personal information</strong> - Phone numbers, addresses, or other private details</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Platform Purpose */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Educational Focus</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">For Students</h4>
              <ul className="space-y-2 text-gray-600">
                <li>• Connect with teachers and peers</li>
                <li>• Join study groups and discussions</li>
                <li>• Get homework help and guidance</li>
                <li>• Participate in class activities</li>
                <li>• Access educational resources</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">For Teachers</h4>
              <ul className="space-y-2 text-gray-600">
                <li>• Communicate with students</li>
                <li>• Share educational materials</li>
                <li>• Provide personalized support</li>
                <li>• Create collaborative learning environments</li>
                <li>• Monitor student progress</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Age-Appropriate Features */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Age-Appropriate Communication</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h4 className="font-semibold text-blue-900 mb-3">Special Protection for Younger Students</h4>
            <p className="text-blue-800 mb-3">
              Students under Grade 7 have additional safety measures:
            </p>
            <ul className="space-y-2 text-blue-800">
              <li>• Can only communicate with teachers and administrators</li>
              <li>• Enhanced monitoring and content filtering</li>
              <li>• Restricted access to community features</li>
              <li>• Additional parental notification requirements</li>
            </ul>
          </div>
        </div>

        {/* Consequences */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Enforcement & Consequences</h3>
          <div className="space-y-4">
            <p className="text-gray-600">
              Violations of these terms may result in:
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">First Warning</h4>
                <p className="text-yellow-800 text-sm">Account notification and reminder of guidelines</p>
              </div>
              <div className="bg-primary/10 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-900 mb-2">Temporary Suspension</h4>
                <p className="text-primary text-sm">Chat privileges suspended for 1-7 days</p>
              </div>
              <div className="bg-primary/10 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-primary-900 mb-2">Permanent Ban</h4>
                <p className="text-primary-800 text-sm">Complete removal from platform for serious violations</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reporting */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Report Inappropriate Behavior</h3>
          <div className="bg-gray-50 rounded-xl p-6">
            <p className="text-gray-700 mb-4">
              If you encounter any inappropriate behavior, please report it immediately:
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#A0FAB2] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                <span className="text-gray-700">Contact Tech Support through the chat system</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#A0FAB2] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">2</span>
                </div>
                <span className="text-gray-700">Use the "Report User" feature in conversations</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#A0FAB2] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">3</span>
                </div>
                <span className="text-gray-700">Email support@edufiliova.com for urgent matters</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Together We Learn, Together We Grow</h3>
            <p className="text-gray-600 mb-4">
              By using EduFiliova's chat system, you agree to these terms and commit to maintaining a positive, educational environment for all users.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <span>Last updated: {new Date().toLocaleDateString()}</span>
              <span>•</span>
              <span>EduFiliova Educational Platform</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatTermsPage;
