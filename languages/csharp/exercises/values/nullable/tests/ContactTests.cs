// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class ContactTests
{
    static Contact Ada => new("Ada Lovelace", "ada@example.com", "555-0100", "12 Mill Lane");

    [RetrainerTest("a contact with an email displays both", Concept = "csharp.values.nullable")]
    public void DisplayWithEmail()
    {
        Assert.Equal("Ada Lovelace <ada@example.com>", Contacts.Display(Ada));
    }

    [RetrainerTest("a contact without an email displays the name alone", Concept = "csharp.values.nullable")]
    public void DisplayWithoutEmail()
    {
        var contact = new Contact("Ada Lovelace", null, "555-0100", null);
        Assert.Equal("Ada Lovelace", Contacts.Display(contact));
    }

    [RetrainerTest("email is the best channel when it exists", Concept = "csharp.types.patterns")]
    public void ChannelEmail()
    {
        Assert.Equal("email", Contacts.BestChannel(Ada));
    }

    [RetrainerTest("phone comes next, then post", Concept = "csharp.types.patterns")]
    public void ChannelOrder()
    {
        Assert.Equal("phone", Contacts.BestChannel(new Contact("A", null, "555-0100", "12 Mill Lane")));
        Assert.Equal("post", Contacts.BestChannel(new Contact("A", null, null, "12 Mill Lane")));
    }

    [RetrainerTest("a contact with nothing has no channel", Concept = "csharp.types.patterns")]
    public void ChannelNone()
    {
        Assert.Equal("none", Contacts.BestChannel(new Contact("A", null, null, null)));
    }

    [RetrainerTest("reachable counts the contacts with any channel", Concept = "csharp.values.nullable")]
    public void Reachable()
    {
        var contacts = new[]
        {
            Ada,
            new Contact("B", null, "555-0101", null),
            new Contact("C", null, null, null),
            new Contact("D", null, null, "4 The Green"),
        };

        Assert.Equal(3, Contacts.Reachable(contacts));
    }

    [RetrainerTest("initials take the first letter of each part", Concept = "csharp.values.nullable")]
    public void Initials()
    {
        Assert.Equal("AL", Contacts.Initials(Ada));
        Assert.Equal("A", Contacts.Initials(new Contact("Ada", null, null, null)));
    }
}
