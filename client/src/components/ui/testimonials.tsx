import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SparklesCore } from '@/components/ui/sparkles'

const testimonial1 = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/07299195-4325-4e1b-91eb-e4f39adc8cc8.png";
const testimonial2 = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/3e21ccac-3d97-466d-b256-b4c769bab6bd.png";
const testimonial3 = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/77ea4a18-3c57-4db9-a014-94e0f442fd1b.png";
const testimonial4 = "https://pub-ef49f2e140c14d1e8242964b30306699.r2.dev/assets/3c6cac5b-65f6-4d8d-8f7f-d238d24b0dd0.png";

export default function Testimonials() {
    return (
        <section className="py-16 md:py-32 relative bg-black overflow-hidden">
            <div className="absolute inset-0 w-full h-full">
                <SparklesCore
                    id="testimonialSparkles"
                    background="transparent"
                    minSize={0.6}
                    maxSize={1.4}
                    particleDensity={100}
                    className="w-full h-full"
                    particleColor="#FFFFFF"
                    speed={1}
                />
            </div>
            
            <div className="mx-auto max-w-6xl space-y-8 px-6 md:space-y-16 relative z-10">
                <div className="relative z-10 mx-auto max-w-xl space-y-6 text-center md:space-y-12">
                    <h2 className="text-[40px] font-bold text-white">Built by <span style={{ color: '#0C332C' }}>Educators</span>, loved by thousands of <span style={{ color: '#0C332C' }}>Learners</span></h2>
                    <p className="text-gray-300">EduFiliova empowers students, teachers, and creators to achieve their goals. Here's what our community has to say about their experience.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-rows-2">
                    <div className="sm:col-span-2 lg:row-span-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all" transition-all duration-300 data-testid="card-testimonial-0">
                        <blockquote className="flex flex-col h-full gap-3">
                            <p className="text-sm text-white/90 leading-relaxed flex-1">As a high school teacher, I've tried many platforms, but EduFiliova stands out. The ability to create and sell my own courses while accessing premium content has been incredible. My students love the interactive lessons, and I've built a side income doing what I'm passionate about. The platform truly understands educators' needs—from course creation tools to student engagement features. I've seen my students' test scores improve by 25% since implementing these resources. The community support is exceptional, and the analytics help me track progress effectively. What started as a teaching tool has become a thriving side business. I can now reach students globally while maintaining my full-time position. The flexible payment options and fair revenue sharing make it sustainable for educators at any level.</p>
                            <div className="flex items-center gap-2 mt-2">
                                <Avatar className="size-9 border border-white/20">
                                    <AvatarImage src={testimonial1} alt="Mei Lin Chen" loading="lazy" />
                                    <AvatarFallback>MC</AvatarFallback>
                                </Avatar>
                                <div>
                                    <cite className="text-xs font-medium not-italic text-white">Mei Lin Chen</cite>
                                    <span className="block text-xs text-white/60">Physics Teacher</span>
                                </div>
                            </div>
                        </blockquote>
                    </div>
                    
                    <div className="md:col-span-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all" transition-all duration-300 data-testid="card-testimonial-1">
                        <blockquote className="flex flex-col h-full gap-3">
                            <p className="text-sm text-white/90 leading-relaxed flex-1">EduFiliova helped me transition from corporate to freelance teaching. The subscription model is fair, the student base is engaged, and the support is outstanding. I'm now earning more while having complete flexibility.</p>
                            <div className="flex items-center gap-2 mt-2">
                                <Avatar className="size-9 border border-white/20">
                                    <AvatarImage src={testimonial2} alt="Marcus Thompson" loading="lazy" />
                                    <AvatarFallback>MT</AvatarFallback>
                                </Avatar>
                                <div>
                                    <cite className="text-xs font-medium not-italic text-white">Marcus Thompson</cite>
                                    <span className="block text-xs text-white/60">Business Instructor</span>
                                </div>
                            </div>
                        </blockquote>
                    </div>
                    
                    <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all" transition-all duration-300 data-testid="card-testimonial-2">
                        <blockquote className="flex flex-col h-full gap-3">
                            <p className="text-sm text-white/90 leading-relaxed flex-1">I'm a college student juggling multiple subjects. EduFiliova's subscription gives me access to everything I need at an affordable price. The tutoring sessions saved my GPA!</p>
                            <div className="flex items-center gap-2 mt-2">
                                <Avatar className="size-9 border border-white/20">
                                    <AvatarImage src={testimonial3} alt="Philly Djabe" loading="lazy" />
                                    <AvatarFallback>PD</AvatarFallback>
                                </Avatar>
                                <div>
                                    <cite className="text-xs font-medium not-italic text-white">Philly Djabe</cite>
                                    <span className="block text-xs text-white/60">Engineering Student</span>
                                </div>
                            </div>
                        </blockquote>
                    </div>
                    
                    <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all" transition-all duration-300 data-testid="card-testimonial-3">
                        <blockquote className="flex flex-col h-full gap-3">
                            <p className="text-sm text-white/90 leading-relaxed flex-1">The digital marketplace is brilliant! I sell study guides and templates while learning from top instructors. EduFiliova has become my one-stop platform for education.</p>
                            <div className="flex items-center gap-2 mt-2">
                                <Avatar className="size-9 border border-white/20">
                                    <AvatarImage src={testimonial4} alt="Amir Patel" loading="lazy" />
                                    <AvatarFallback>AP</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-xs font-medium text-white">Amir Patel</p>
                                    <span className="block text-xs text-white/60">Content Creator</span>
                                </div>
                            </div>
                        </blockquote>
                    </div>
                </div>
            </div>
        </section>
    )
}
