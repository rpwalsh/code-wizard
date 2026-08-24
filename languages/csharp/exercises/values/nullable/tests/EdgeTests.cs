// Copyright 2026 Ryan P. Walsh (rpwalsh.github.io)
using Retrainer;
using Exercise;

public class EdgeTests
{
    [RetrainerTest("a name of only spaces has no initials rather than throwing", Concept = "csharp.values.nullable")]
    public void WhitespaceName()
    {
        // A form with a space bar produces this every day. Reaching for the
        // first character of the first part throws on it.
        Assert.Equal(string.Empty, Contacts.Initials(new Contact("   ", null, null, null)));
        Assert.Equal(string.Empty, Contacts.Initials(new Contact("", null, null, null)));
    }

    [RetrainerTest("repeated spaces do not produce empty initials", Concept = "csharp.values.nullable")]
    public void RepeatedSpaces()
    {
        // Splitting without RemoveEmptyEntries yields empty parts here, and
        // taking part[0] of an empty string throws.
        Assert.Equal("AL", Contacts.Initials(new Contact("Ada   Lovelace", null, null, null)));
        Assert.Equal("AL", Contacts.Initials(new Contact("  Ada Lovelace  ", null, null, null)));
    }

    [RetrainerTest("initials are upper-cased regardless of the input", Concept = "csharp.values.nullable")]
    public void UpperCased()
    {
        Assert.Equal("AL", Contacts.Initials(new Contact("ada lovelace", null, null, null)));
    }

    [RetrainerTest("an empty email string is a value, not an absence", Concept = "csharp.types.patterns")]
    public void EmptyEmailIsPresent()
    {
        // `""` is not null. The prompt says "when an email is present", and
        // an empty string is present — a distinction that matters because
        // treating them the same is a decision, not an accident.
        var contact = new Contact("Ada", "", null, null);
        Assert.Equal("Ada <>", Contacts.Display(contact));
        Assert.Equal("email", Contacts.BestChannel(contact));
    }

    [RetrainerTest("reachable on an empty list is zero", Concept = "csharp.values.nullable")]
    public void ReachableEmpty()
    {
        Assert.Equal(0, Contacts.Reachable(Array.Empty<Contact>()));
    }

    [RetrainerTest("reachable counts none of a list where nobody is reachable", Concept = "csharp.values.nullable")]
    public void ReachableNone()
    {
        var contacts = new[]
        {
            new Contact("A", null, null, null),
            new Contact("B", null, null, null),
        };

        Assert.Equal(0, Contacts.Reachable(contacts));
    }

    [RetrainerTest("the channel arms are ordered, not merely exhaustive", Concept = "csharp.types.patterns")]
    public void ArmOrder()
    {
        // Everything present: only the first arm may win. A switch whose
        // arms were reordered would still be exhaustive and still compile,
        // and would answer this wrongly.
        var everything = new Contact("A", "a@example.com", "555-0100", "4 The Green");
        Assert.Equal("email", Contacts.BestChannel(everything));

        var phoneAndPost = new Contact("A", null, "555-0100", "4 The Green");
        Assert.Equal("phone", Contacts.BestChannel(phoneAndPost));
    }
}
