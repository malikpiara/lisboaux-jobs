import Link from 'next/link';

const listOfJobs = [
  {
    id: 0,
    title: 'Product Designer',
    company: 'Airbnb',
    location: 'Porto',
    submittedOn: 'Yesterday',
  },
  {
    id: 1,
    title: 'Job Board Manager (Volunteer)',
    company: 'LisboaUX',
    location: 'Lisboa',
    submittedOn: 'Today',
  },
];

export default function Home() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-zinc-50 font-sans'>
      <div className='flex min-h-screen w-full max-w-3xl flex-col items-center py-4 px-16 bg-white sm:items-start'>
        <nav className='w-full bg-[#3847E6] text-white p-1 rounded-t-sm'>
          <div className='font-semibold'>
            <Link href={'/'}>Design Jobs</Link>
          </div>
        </nav>
        <main className='w-full bg-[#FFF7F1]'>
          <div className='flex-col space-y-2 mt-2 p-2'>
            {listOfJobs.map((job) => {
              return (
                <div key={job.id}>
                  <div>{job.title}</div>
                  <div className='flex text-sm gap-2'>
                    <div>{job.company}</div>
                    <div>{job.location}</div>
                    <div>{job.submittedOn}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
