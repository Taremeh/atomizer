import { convertPoliticianToMarkdown } from "./politician2md.service";

describe('politicianToMarkdown', () => {
  it('should convert a full politician object into markdown', () => {
    const politician = {
      firstname: 'Jessica',
      lastname: 'Jaccoud',
      website: 'https://linktr.ee/jaccoud',
      city: 'Berolle',
      email: 'jessica.jaccoud@ps-vd.ch',
      nofChildren: 1,
      gender: 'female',
      occupation: 'Avocate',
      yearOfBirth: 1983,
      party: 'SP',
      civilState: 'Married',
      religion: 'Not specified',
      education: 'University or ETH',
      employers: 'Associ\u00e9e chez Mattenberger, Jaccoud & Ducret Avocats',
      favoriteBooks: null,
      favoriteMovies: null,
      favoriteMusic: null,
      hobbies: 'V\u00e9lo, Gabin mon chien Golden Retriever'
    };

    const expectedMarkdown = `- Jessica Jaccoud
  - website: https://linktr.ee/jaccoud
  - city: Berolle
  - email: jessica.jaccoud@ps-vd.ch
  - nofChildren: 1
  - gender: female
  - occupation: Avocate
  - yearOfBirth: 1983
  - party: SP
  - civilState: Married
  - religion: Not specified
  - education: University or ETH
  - employers: Associée chez Mattenberger, Jaccoud & Ducret Avocats
  - favoriteBooks: null
  - favoriteMovies: null
  - favoriteMusic: null
  - hobbies: Vélo, Gabin mon chien Golden Retriever
`;

    const markdown = convertPoliticianToMarkdown(politician);
    expect(markdown).toEqual(expectedMarkdown);
  });

  it('should produce markdown with only the name when no extra properties exist', () => {
    const politician = {
      firstname: 'John',
      lastname: 'Doe'
    };

    const expectedMarkdown = `- John Doe
`;
    const markdown = convertPoliticianToMarkdown(politician);
    expect(markdown).toEqual(expectedMarkdown);
  });
});
